const rspack = require("@rspack/core");
const path = require("path");
const LicenseCheckerWebpackPlugin = require("license-checker-webpack-plugin");
// import { fileURLToPath } from "url";
// const fileURLToPath = require("url").fileURLToPath;

// https://www.rspack.dev/config/devtool.html
// https://www.rspack.dev/guide/migrate-from-webpack.html

// mimic CommonJS variables -- not needed if using CommonJS
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

module.exports = function (env, argv) {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    entry: {
      main: "./src/index.tsx",
    },
    output: {
      filename: "[name].[chunkhash:8].js",
      path: path.resolve(__dirname, "dist"),
    },

    devtool: isProduction
      ? "cheap-module-source-map"
      : "eval-cheap-module-source-map",

    plugins: [
      // copy static site files to dist
      ...(isProduction
        ? [new rspack.CopyRspackPlugin({ patterns: [{ from: "./site" }] })]
        : []),
      // output license info
      ...(isProduction
        ? [new LicenseCheckerWebpackPlugin()]
        : []),
      // index.html template
      new rspack.HtmlRspackPlugin({ template: `index${isProduction ? ".production" : ""}.html`})
    ],

    module: {
      rules: [
        {
          test: /\.css$/i,
          type: "css", // this is enabled by default for .css, so you don't need to specify it
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
          type: "asset/resource",
        },
        ...(isProduction
          ? [
              {
                test: /\.(jsx?|tsx?)$/i,
                // loader: require.resolve('./normal-module-replacement.cjs'),
                use: (info) => ({
                  loader: require.resolve("./environment-dep-replace.cjs"),
                  options: {
                    loaderOptionParam: "paramValue",
                  },
                }),
              },
            ]
          : [/** in dev don't replace dependencies */]),
      ],
    },

    optimization: {
      chunkIds: "deterministic",
    },

    devServer: {
      port: process.env.PORT || 8080, // Port Number
      host: "localhost", // Change to '0.0.0.0' for external facing server
      static: [{ directory: path.resolve(__dirname, "dist") }],
    },
  };
};
