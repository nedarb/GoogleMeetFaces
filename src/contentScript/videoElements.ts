import { findAncestor } from "./domUtil";
import { Participant } from "../shared/IContentScript";
import { MemoizedSettings } from "./MemoizedSettings";

const TALKING_SELECTOR = ".kssMZb";
enum VideoElementEventNames {
  LEAVE_PIP = "leavepictureinpicture",
}
enum ElementDataKey {
  ParticipantId = "meetExtId",
}

console.log("Google Meet Faces startup");

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
  const participants: Record<string, Array<HTMLVideoElement>> = {};
  for (const video of videos) {
    const name = getParticipantNameForVideo(video);
    if (!name) {
      continue;
    } else if (!participants.hasOwnProperty(name)) {
      participants[name] = [];
    }
    participants[name].push(video);
  }

  const results: Array<Participant> = Object.entries(participants).map(
    ([name, videos]) => {
      // A participant is active if they are the one currently in PiP mode.
      const active = videos.some((video) => currentlyShowingPip.has(video));

      // A participant is available if they have a video enabled.
      const available = videos.some(
        (video) =>
          video.style.display !== "none" &&
          video.readyState === video.HAVE_ENOUGH_DATA
      );

      const isTalking = videos.some((video) =>
        findParticipantEl(video)?.querySelector(TALKING_SELECTOR)
      );

      // We assign an identifier to each participant's videos so we can easily
      // query them later. Since the names are unique in this case (can be
      // improved later), using the base64 of the names should be enough for now.
      const id = btoa(name);
      videos.forEach(
        (video) => (video.dataset[ElementDataKey.ParticipantId] = id)
      );

      const isPinned = !videos.some((video) =>
        findParticipantEl(video)?.matches(".PoIECb")
      );

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

function findParticipantEl(el): Element | undefined {
  return findAncestor(el, "div[data-requested-participant-id]");
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
  const video = participant.videoElements.find(
    (video) => video.style.display !== "none"
  );

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
