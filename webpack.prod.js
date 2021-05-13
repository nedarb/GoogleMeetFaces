const merge = require("webpack-merge");
const webpack = require("webpack");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",
  output: { clean: true },
  plugins: [
    new webpack.DefinePlugin({
      __IN_DEBUG__: JSON.stringify(false),
    }),
  ],
});
