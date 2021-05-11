import { findAncestor } from "./domUtil";
import { Participant } from "../shared/IContentScript";
import { MemoizedSettings } from "./MemoizedSettings";
import { video as talkingVideoElement } from "./textVideoStream";

const TALKING_SELECTOR = ".kssMZb,.GskdZ";
enum VideoElementEventNames {
  LEAVE_PIP = "leavepictureinpicture",
}
enum ElementDataKey {
  ParticipantId = "meetExtId",
}

/**
 * keep a set of video elements that are showing picture-in-picture (should only be length 0-1 but leaving room for API changes in the future)
 */
const currentlyShowingPip = new WeakSet<HTMLVideoElement>();

/**
 * Determine which participant we should show
 */
export async function findParticipantToShow(
  settings: Readonly<MemoizedSettings>
): Promise<Readonly<Participant> | undefined> {
  const currentSettings = await settings.getSettings();

  const allParticipants = getParticipantsList();
  const participants =
    currentSettings.includeYou === false && allParticipants.length > 0
      ? allParticipants.filter((p) => !p.isYou)
      : allParticipants;

  // desired participants are ones that are (1) not me and (2) are available/have video
  const desiredParticipants = participants.filter(
    (p) => !p.isYou && p.available
  );

  const participant =
    participants.find((p) => p.isTalking && p.available && !p.isYou) ||
    participants.find((p) => p.available && !p.isYou && !p.isPinned) ||
    desiredParticipants[0] ||
    participants[0];
  return participant;
}

/**
 * Get a list of participants and their video elements
 * @returns
 */
export function getParticipantsList(): Readonly<Array<Participant>> {
  const videos = Array.from(document.querySelectorAll("video"));
  const participants: Record<
    string,
    {
      name: string;
      participantElement: Element;
      videos: Array<HTMLVideoElement>;
    }
  > = {};

  const participantElements = findParticipantElements();
  for (const video of videos) {
    const participantEl = findParticipantEl(video);
    const name =
      getParticipantNameForVideo(video) ||
      (participantEl?.querySelector("[data-self-name]") as HTMLElement)?.dataset
        .selfName;
    const sourceId =
      (participantEl.querySelector("[data-ssrc]") as HTMLElement)?.dataset
        .ssrc || name;
    if (!name) {
      continue;
    } else if (!participants.hasOwnProperty(sourceId)) {
      participants[sourceId] = {
        name,
        participantElement: findParticipantEl(video),
        videos: [],
      };
    }
    participants[sourceId].videos.push(video);
  }

  for (const participantEl of participantElements) {
    const nameEl = participantEl.querySelector(
      "[data-self-name]"
    ) as HTMLElement;
    const name = nameEl.innerText?.trim() || nameEl?.dataset?.selfName;
    const sourceId =
      (participantEl.querySelector("[data-ssrc]") as HTMLElement)?.dataset
        .ssrc || name;
    if (sourceId && !(sourceId in participants)) {
      participants[sourceId] = {
        name,
        participantElement: participantEl,
        videos: [],
      };
    }
  }

  const results: Array<Participant> = Object.entries(participants).map(
    ([sourceId, { name, participantElement, videos }]) => {
      // A participant is active if they are the one currently in PiP mode.
      const active = videos.some((video) => currentlyShowingPip.has(video));

      // A participant is available if they have a video enabled.
      const available = videos.some(
        (video) =>
          video.style.display !== "none" &&
          video.readyState === video.HAVE_ENOUGH_DATA
      );

      const isTalking =
        !!participantElement?.querySelector(TALKING_SELECTOR) ||
        videos.some((video) =>
          findParticipantEl(video)?.querySelector(TALKING_SELECTOR)
        );

      // We assign an identifier to each participant's videos so we can easily
      // query them later. Since the names are unique in this case (can be
      // improved later), using the base64 of the names should be enough for now.
      const id = btoa(name);
      videos.forEach(
        (video) => (video.dataset[ElementDataKey.ParticipantId] = id)
      );

      const isPinned =
        !videos.some((video) => findParticipantEl(video)?.matches(".PoIECb")) ||
        participantElement?.matches(".PoIECb");

      return {
        id,
        name,
        active,
        available,
        isYou: videos.some((video) => video.matches(".Gv1mTb-PVLJEc")),
        isTalking,
        videoElements: videos,
        isPinned,
      };
    }
  );

  return results;
}

function findParticipantElements(): Array<Element> {
  return Array.from(
    document.querySelectorAll("div[data-requested-participant-id]")
  );
}

function findParticipantEl(el): Element | undefined {
  return (
    findAncestor(el, "div[data-requested-participant-id]") ||
    el.parentElement.parentElement.parentElement
  );
}

function getParticipantNameForVideo(video) {
  // First check if this video is displayed in the main grid.
  const ancestor = video.parentElement.parentElement;
  let name = ancestor.querySelector("[data-self-name]");
  if (!name) {
    const children = [...ancestor.parentElement.children];
    name = children.find((child) => "selfName" in child.dataset);
  }
  return name ? name.textContent : null;
}
export async function activatePictureInPicture(
  participant: Participant
): Promise<Participant | false> {
  const video =
    participant.videoElements.find((video) => video.style.display !== "none") ||
    talkingVideoElement;

  if (!video) {
    return;
  }

  try {
    // short-circuit if already showing this video
    const isActive = currentlyShowingPip.has(video);
    if (isActive) {
      return participant;
    }

    console.info(`Activating PIP for ${participant.name}`);
    await video.requestPictureInPicture();

    currentlyShowingPip.add(video);

    video.addEventListener(
      VideoElementEventNames.LEAVE_PIP,
      onLeavePictureInPicture
    );

    return participant;
  } catch (error) {
    console.error("[google-meet-faces]", error);
    return false;
  }
}

export function exitPictureInPicture() {
  const current = Array.from(document.querySelectorAll("video")).filter((v) =>
    currentlyShowingPip.has(v)
  );
  if (current.length > 0) {
    const video = current[0];
    video.removeEventListener(
      VideoElementEventNames.LEAVE_PIP,
      onLeavePictureInPicture
    );
    currentlyShowingPip.delete(video);
  }
  return document.exitPictureInPicture();
}

function onLeavePictureInPicture(event: Event) {
  const video = event.target as HTMLVideoElement;
  currentlyShowingPip.delete(video);
  event.target.removeEventListener(
    VideoElementEventNames.LEAVE_PIP,
    onLeavePictureInPicture
  );
}
