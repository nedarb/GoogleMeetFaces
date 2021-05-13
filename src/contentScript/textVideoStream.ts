import canvasTxt from "canvas-txt";

const width = 320,
  height = (width / 16) * 9;
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

class ImageCache {
  private readonly cache: Map<string, Promise<HTMLImageElement>> = new Map();

  async fetch(url: string): Promise<HTMLImageElement> {
    if (!this.cache.has(url)) {
      const promise = (async () => {
        const image = new Image();

        image.crossOrigin = "true";
        image.src = url;
        await image.decode();
        return image;
      })();
      this.cache.set(url, promise);
      return promise;
    }

    return await this.cache.get(url);
  }
}

const imageCache = new ImageCache();

function drawImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  position: {
    /* x that is the center */
    x: number;
    y: number;
    width: number;
    height: number;
  }
) {
  const desiredWidth = position.width;
  const desiredHeight = position.height;

  // draw the cached images to temporary canvas and return the context
  ctx.save();
  ctx.beginPath();
  ctx.arc(position.x, position.y, desiredWidth / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    position.x - desiredWidth / 2,
    position.y - desiredHeight / 2,
    desiredWidth,
    desiredHeight
  );

  ctx.restore();
}

export async function drawText(txt: string, options?: { image: string }) {
  const ctx = canvas.getContext("2d");
  //const txt = "Lorem ipsum dolor sit amet";
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  let hasImage = false;

  if (options?.image) {
    hasImage = true;
    const image = await imageCache.fetch(options.image);

    // draw image on the left 3rd of the canvase:
    drawImage(ctx, image, {
      x: width / 3 - width / 3 / 2,
      y: height / 2,
      width: width / 3.5,
      height: width / 3.5,
    });

    // draw image in top half of canvas:
    // drawImage(ctx, image, {
    //   x: width / 2,
    //   y: height / 4,
    //   width: height / 2.1,
    //   height: height / 2.1,
    // });
  }

  ctx.fillStyle = "black";
  canvasTxt.fontSize = 34;
  canvasTxt.font = `'Google Sans',Roboto,Arial,sans-serif`;
  // canvasTxt.align = "left";

  canvasTxt.drawText(
    ctx,
    txt,
    hasImage ? width / 3 : 0,
    0,
    width * (hasImage ? 2 / 3 : 1),
    height
  );
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
