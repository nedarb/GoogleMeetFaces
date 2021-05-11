import canvasTxt from "canvas-txt";

const width = 320,
  height = 240;
const canvas = document.createElement("canvas");
export const video = document.createElement("video");
// @ts-ignore
const stream = canvas.captureStream(2);
video.muted = true;
video.srcObject = stream;
video.play();
canvas.style.position = "absolute";
canvas.style.border = "solid 1px red";
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
canvas.style.zIndex = "-100";

export function showCanvas() {
  canvas.style.zIndex = "100";
}

export function hideCanvas() {
  canvas.style.zIndex = "-100";
}

document.body.append(canvas);

if (window.devicePixelRatio) {
  var hidefCanvasWidth = canvas.clientWidth;
  var hidefCanvasHeight = canvas.clientHeight;

  canvas.width = hidefCanvasWidth * window.devicePixelRatio;
  canvas.height = hidefCanvasHeight * window.devicePixelRatio;
  canvas
    .getContext("2d")
    .scale(window.devicePixelRatio, window.devicePixelRatio);
}

export async function drawText(txt: string) {
  const ctx = canvas.getContext("2d");
  //const txt = "Lorem ipsum dolor sit amet";
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "black";
  canvasTxt.fontSize = 36;
  canvasTxt.font = `'Google Sans',Roboto,Arial,sans-serif`;

  canvasTxt.drawText(ctx, txt, 0, 0, width, height);
}

export function requestPictureInPicture() {
  return video.requestPictureInPicture();
}

/**
 * Request Picture in Picture of Video.
 * 
 * video.addEventListener("loadedmetadata", function handler() {
    video.removeEventListener("loadedmetadata", handler);

    // You should be able to request the picture in picture API from here
    // Request on my dom element
    enterPictureInPicture(video);
  });
 *
 * @param {HTMLVideoElement} videoElement
 * @returns {undefined}
 */
function enterPictureInPicture(videoElement) {
  if (
    document.pictureInPictureEnabled &&
    !videoElement.disablePictureInPicture
  ) {
    try {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      }

      videoElement.requestPictureInPicture();
    } catch (err) {
      console.error(err);
    }
  }
}
