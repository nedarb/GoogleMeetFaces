declare global {
  interface Document {
    msHidden?: any;
    webkitHidden?: any;
  }
}

const { hidden, visibilityChange } = (function () {
  if (typeof document.hidden !== "undefined") {
    // Opera 12.10 and Firefox 18 and later support
    return { hidden: "hidden", visibilityChange: "visibilitychange" };
  } else if (typeof document.msHidden !== "undefined") {
    return { hidden: "msHidden", visibilityChange: "msvisibilitychange" };
  } else if (typeof document.webkitHidden !== "undefined") {
    return {
      hidden: "webkitHidden",
      visibilityChange: "webkitvisibilitychange",
    };
  }
})();

export class VisibilityMonitor {
  constructor({ onHidden, onShown }) {
    // If the page is hidden, pause the video;
    // if the page is shown, play the video
    function handleVisibilityChange() {
      if (VisibilityMonitor.isHidden) {
        onHidden();
      } else {
        onShown();
      }
    }

    // Warn if the browser doesn't support addEventListener or the Page Visibility API
    if (
      typeof document.addEventListener === "undefined" ||
      hidden === undefined
    ) {
      console.log(
        "This requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API."
      );
    } else {
      // Handle page visibility change
      document.addEventListener(
        visibilityChange,
        handleVisibilityChange.bind(this),
        false
      );
    }
  }

  static get isHidden(): boolean {
    return document[hidden];
  }
}
