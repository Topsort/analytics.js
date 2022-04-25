/* eslint @typescript-eslint/no-var-requires: "off" */
const path = require("path");

const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: {
    ts: "./src/detector.ts",
    "ts.min": "./src/detector.ts",
  },
  output: {
    path: path.resolve(__dirname, "_bundles"),
    filename: "[name].js",
    libraryTarget: "umd",
    library: "ts",
    umdNamedDefine: true,
  },
  devtool: "source-map",
  mode: "production",
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
    filename: "ts.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new webpack.DefinePlugin({
      "Node.ELEMENT_NODE": 1,
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          toplevel: true,
          compress: {
            passes: 50,
            toplevel: true,
            unsafe: true,
            unsafe_undefined: true,
            inline: true,
          },
          enclose:
            "window,document,Math,JSON,undefined,HTMLElement:window,document,Math,JSON,void 0,HTMLElement",
          mangle: {
            properties: {
              regex: "^_",
            },
          },
        },
      }),
    ],
  },
};
