import { VisibilityMonitor } from "./VisibilityMonitor";
import { ContentScript } from "../shared/ContentScript";
import { emit } from "../shared/bindings";
import { MemoizedSettings } from "./MemoizedSettings";
import { Poller } from "./Poller";
import {
  activatePictureInPicture,
  exitPictureInPicture,
  findParticipantToShow,
  getParticipantsList,
} from "./videoElements";
import { drawText, hideCanvas, showCanvas } from "./textVideoStream";

console.log("Google Meet Faces startup");

// only run if PiP is enabled
if (document.pictureInPictureEnabled) {
  const settings = new MemoizedSettings();

  drawText("[Google Meet Faces]");

  // make a poller for when the window is hidden
  const poller = new Poller(async () => {
    const { isEnabled, highlightNoVideo } = await settings.getSettings();
    if (!VisibilityMonitor.isHidden) {
      // stop polling if window is no longer hidden
      return false;
    }

    if (!isEnabled) {
      // disable if we've gone disabled (via popup settings)
      exitPictureInPicture();
      return false;
    }

    // get who is talking
    const next = await findParticipantToShow(settings);
    if (next) {
      activatePictureInPicture(next);
    }
    return true;
  });

  // start up a visibility monitor and get notified when window visibility changes
  new VisibilityMonitor({
    onHidden: async () => {
      const { isEnabled } = await settings.getSettings();
      if (!isEnabled) {
        return;
      }

      poller.start();
    },
    onShown: () => {
      poller.stop();
      exitPictureInPicture();
    },
  });

  // expose functionality to the popup/background script
  emit<ContentScript>({
    settingsChanged: async () => {
      const currentlyEnabled = (await settings.getSettings()).isEnabled;
      const { isEnabled, debugging } = await settings.reload();
      if (currentlyEnabled !== isEnabled) {
        if (!isEnabled) {
          exitPictureInPicture();
          poller.stop();
        } else {
          poller.start();
        }
      }

      debugging ? showCanvas() : hideCanvas();
    },
    getParticipants: async () => {
      return getParticipantsList();
    },
  });
}
