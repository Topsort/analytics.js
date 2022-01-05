/* eslint @typescript-eslint/no-var-requires: "off" */
const path = require("path");

module.exports = {
  entry: "./tests/components.tsx",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "test-bundle-react.js",
    path: path.resolve(__dirname, "dist"),
  },
};
