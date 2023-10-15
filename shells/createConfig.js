const path = require("path");
const webpack = require("webpack");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = (config, target = { chrome: 52, firefox: 48 }) => {
  const bubleOptions = {
    target,
    objectAssign: "Object.assign",
    transforms: {
      forOf: false,
      modules: false,
    },
  };

  const baseConfig = {
    resolve: {
      alias: {
        src: path.resolve(__dirname, "../src"),
        views: path.resolve(__dirname, "../src/devtools/views"),
        components: path.resolve(__dirname, "../src/devtools/components"),
      },
      fallback: {
        path: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: "babel-loader",
          exclude: /node_modules|vue\/dist|vuex\/dist/,
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    chrome: 52,
                    firefox: 48,
                  },
                  useBuiltIns: "usage",
                  corejs: 3,
                },
              ],
            ],
          },
        },
        {
          test: /\.vue$/,
          loader: "vue-loader",
          options: {
            compilerOptions: {
              preserveWhitespace: false,
            },
            transpileOptions: bubleOptions,
          },
        },
        {
          test: /\.css$/,
          use: ["vue-style-loader", "css-loader"],
        },
        {
          test: /\.styl(us)?$/,
          use: ["vue-style-loader", "css-loader", "stylus-loader"],
        },
        {
          test: /\.(png|woff2)$/,
          type: "asset",
        },
      ],
    },
    performance: {
      hints: false,
    },
    plugins: [
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        "process.env.RELEASE_CHANNEL": JSON.stringify(
          process.env.RELEASE_CHANNEL || "stable"
        ),
      }),
    ],
    devServer: {
      port: process.env.PORT,
    },
  };

  if (process.env.NODE_ENV === "production") {
    baseConfig.plugins.push(
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": '"production"',
      })
    );
  }

  return Object.assign({}, baseConfig, config);
};
