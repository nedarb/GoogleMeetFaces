import * as React from "react";
import * as ReactDOM from "react-dom";
import Debug from "./debug";

window.addEventListener("DOMContentLoaded", (event) => {
  ReactDOM.render(<Debug />, document.getElementById("debug"));
});
