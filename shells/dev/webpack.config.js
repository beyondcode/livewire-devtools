const createConfig = require("../createConfig");
const openInEditor = require("launch-editor-middleware");

module.exports = createConfig({
  mode: "development",
  entry: {
    devtools: "./src/devtools.js",
    backend: "./src/backend.js",
    hook: "./src/hook.js",
    target: "./target/index.js",
  },
  output: {
    path: __dirname + "/build",
    publicPath: "/build/",
    filename: "[name].js",
  },
  devtool: "cheap-module-source-map",
  devServer: {
    onBeforeSetupMiddleware: function (devServer) {
      if (!devServer) {
        throw new Error("webpack-dev-server is not defined");
      }

      devServer.app.use("/__open-in-editor", openInEditor());
    },
  },
});
