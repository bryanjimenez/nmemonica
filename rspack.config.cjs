//@ts-check
const rspack = require("@rspack/core");
const path = require("path");

const LicenseCheckerWebpackPlugin = require("license-checker-webpack-plugin");

//@ts-expect-error rspack.conf outside of tsconfig
const { lan } = require("@nmemonica/snservice/utils/host");
//@ts-expect-error rspack.conf outside of tsconfig
const { yellow, red } = require("@nmemonica/snservice/utils/consoleColor");
//@ts-expect-error rspack.conf outside of tsconfig
const {ca} = require("@nmemonica/snservice/utils/signed-ca");
//@ts-expect-error rspack.conf outside of tsconfig
const {config} = require("@nmemonica/snservice/utils/config");

// import { fileURLToPath } from "url";
// const fileURLToPath = require("url").fileURLToPath;

// https://www.rspack.dev/config/devtool.html
// https://www.rspack.dev/guide/migrate-from-webpack.html

// mimic CommonJS variables -- not needed if using CommonJS
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

module.exports = function (env, argv) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!ca.exists()) {
    console.log(yellow("Creating Certificate Authority"));
    ca.create();
  }

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
      new rspack.CopyRspackPlugin({
        patterns: [
          ...(!isProduction ? [{ from: "./site-dev" }] : []),
          { from: "./site" },
        ],
      }),

      // output license info
      ...(isProduction ? [new LicenseCheckerWebpackPlugin()] : []),
      // index.html template
      new rspack.HtmlRspackPlugin({
        template: `index${isProduction ? ".production" : ""}.html`,
      }),

      new rspack.DefinePlugin({
        "process.env.OS_EXT_FACE_IP_ADDRESS": `"${lan.hostname}"`,  // only in env.development
        "process.env.isSelfSignedCA": `${ca.exists()}`,             // env.dev only
        "process.env.SERVICE_PORT": ca.exists()                     // env.dev only
          ? config.port.https
          : config.port.http,
        "process.env.UI_PORT": config.port.ui,                      // env.dev only
      }),
    ],

    // solution for
    // 'npm link ../child-module'
    // with peerDependency
    resolve: {
      modules: [path.resolve(__dirname, "node_modules"), "node_modules"],
    },

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
                // https://rspack.org/guide/loader.html#using-a-custom-loader
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
          : [
              /** in dev don't replace dependencies */
            ]),
      ],
    },

    optimization: {
      chunkIds: "deterministic",
    },

    devServer: {
      server: ca.exists()
        ? {
            // https://stackoverflow.com/questions/26663404/webpack-dev-server-running-on-https-web-sockets-secure
            // https://webpack.js.org/configuration/dev-server/#devserverhttps
            type: "https",
            options: {
              key: `${config.directory.ca}/${config.ca.server.key}`,
              cert: `${config.directory.ca}/${config.ca.server.crt}`,
            },
          }
        : {},

      port: config.port.ui || 8080, // Port Number
      host: lan.hostname, //"0.0.0.0", //external facing server
      static: [{ directory: path.resolve(__dirname, "dist") }],
    },
  };
};
