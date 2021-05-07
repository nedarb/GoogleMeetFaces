import * as React from "react";
import * as ReactDOM from "react-dom";
import Popup from "./Popup";

window.addEventListener("DOMContentLoaded", (event) => {
  ReactDOM.render(<Popup />, document.getElementById("popup"));
});
