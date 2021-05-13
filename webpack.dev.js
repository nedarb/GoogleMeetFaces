const merge = require("webpack-merge");
const path = require("path");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map", 
  entry: {
    debug: path.join(__dirname, "src/pages/debug/index.tsx"),
  }
});
