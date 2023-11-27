const rspack = require("@rspack/core");
const path = require("path");
const os = require("os");
const LicenseCheckerWebpackPlugin = require("license-checker-webpack-plugin");
require("dotenv").config();
// import { fileURLToPath } from "url";
// const fileURLToPath = require("url").fileURLToPath;

// https://www.rspack.dev/config/devtool.html
// https://www.rspack.dev/guide/migrate-from-webpack.html

// mimic CommonJS variables -- not needed if using CommonJS
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Get OS's external facing ip
const n = os.networkInterfaces();
const ip = Object.values(n)
  .flat()
  .find(({ family, internal }) => family === "IPv4" && !internal);

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

    devtool: isProduction ? false : "eval-cheap-module-source-map",

    plugins: [
      // copy static site files to dist
      ...(isProduction
        ? [new rspack.CopyRspackPlugin({ patterns: [{ from: "./site" }] })]
        : []),
      // output license info
      ...(isProduction ? [new LicenseCheckerWebpackPlugin()] : []),
      // index.html template
      new rspack.HtmlRspackPlugin({
        template: `index${isProduction ? ".production" : ""}.html`,
      }),

      // Replace dotenv variables here
      new rspack.DefinePlugin({
        "process.env.OS_EXT_FACE_IP_ADDRESS": `"${ip.address}"`,
        "process.env.SERVICE_PORT": process.env.SERVICE_PORT,
        "process.env.UI_PORT": process.env.UI_PORT,
      }),
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
      server: {
        // https://stackoverflow.com/questions/26663404/webpack-dev-server-running-on-https-web-sockets-secure
        // https://webpack.js.org/configuration/dev-server/#devserverhttps
        type: "https",
        options: {
          key: "./" + process.env.PATH_KEY,
          cert: "./" + process.env.PATH_CRT,
        },
      },

      port: process.env.UI_PORT || 8080, // Port Number
      host: "0.0.0.0", // external facing server
      static: [{ directory: path.resolve(__dirname, "dist") }],
    },
  };
};
