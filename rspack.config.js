import fs from "node:fs";
import rspack from "@rspack/core";
// import { Configuration } from "@rspack/cli";
import refreshPlugin from "@rspack/plugin-react-refresh";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import LicenseCheckerWebpackPlugin from "license-checker-webpack-plugin";
import { appendLicense } from "./dep-license-writer.js";
import { indexTagHelperPlugin } from "./pwa/plugin/indexTagger.js";
import { serviceWorkerCacheHelperPlugin } from "./pwa/plugin/swPlugin.js";

const isDev = process.env.NODE_ENV === "development";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodeModulesDir = path.resolve(__dirname, "node_modules");

export default function rspackConfig(
  /** @type string */ _env,
  /** @type string[] */ argv
) {
  const isProduction = process.env.NODE_ENV === "production";

  const appVersion = JSON.parse(
    fs.readFileSync("package.json", "utf-8")
  ).version;

  return {
    context: __dirname,
    entry: {
      main: "./src/index.tsx",
      ...(isProduction
        ? {
            sw: {
              filename: "sw.js",
              import: "./pwa/src/sw.ts",
            },
          }
        : {
            /** see rspack.config.sw.js */
          }),
      "voice-worker-ja": {
        filename: "voice-worker-ja.js",
        import: "./src/workers/voiceWorker-ja.ts",
      },
      "voice-worker-en": {
        filename: "voice-worker-en.js",
        import: "./src/workers/voiceWorker-en.ts",
      },
    },
    output: {
      filename: "[name].[chunkhash:8].js",
      path: path.resolve(__dirname, "dist"),
    },

    experiments: {
      asyncWebAssembly: true,
      css: true,
    },

    // devtool: isProduction ? false : "eval-cheap-module-source-map",
    resolve: {
      // solution for
      // 'npm link ../child-module'
      // with peerDependency
      modules: [nodeModulesDir, "node_modules"],

      extensions: ["...", ".ts", ".tsx"],
      fallback: {
        fs: false,
        crypto: path.normalize(nodeModulesDir + path.sep + "crypto-browserify"),
        stream: path.normalize(nodeModulesDir + path.sep + "stream-browserify"),
      },
    },
    module: {
      rules: [
        {
          test: /\.(png|svg|jpe?g|gif|woff|woff2|htsvoice)$/i,
          type: "asset/resource",
        },
        ...(isProduction
          ? [
              {
                // https://rspack.org/guide/loader.html#using-a-custom-loader
                test: /\.(jsx?|tsx?)$/i,
                use: (/** @type unknown*/ _info) => ({
                  loader: "./environment-dep-replace.cjs",
                  options: {
                    loaderOptionParam: "paramValue",
                  },
                }),
              },
            ]
          : [
              /** in dev don't replace dependencies */
            ]),
        {
          test: /\.(jsx?|tsx?)$/,
          use: [
            {
              loader: "builtin:swc-loader",
              options: {
                jsc: {
                  parser: {
                    syntax: "typescript",
                    tsx: true,
                  },
                  transform: {
                    react: {
                      runtime: "automatic",
                      development: isDev,
                      refresh: isDev,
                    },
                  },
                },
                env: {
                  targets: [
                    "chrome >= 87",
                    "edge >= 88",
                    "firefox >= 78",
                    "safari >= 14",
                  ],
                },
              },
            },
          ],
        },
      ],
    },

    plugins: [
      // copy static site files to dist
      new rspack.CopyRspackPlugin({
        patterns: [
          ...(!isProduction ? [{ from: "./site/dev" }] : []),
          { from: "./site/prod" },
        ],
      }),

      // output license info
      ...(isProduction
        ? [
            new LicenseCheckerWebpackPlugin({
              allow: "MIT OR BSD-3-Clause OR Apache-2.0 OR CC-BY-4.0 OR ISC",
              outputWriter: appendLicense,
            }),
          ]
        : []),

      // replacements in *code* (strings need "")
      new rspack.DefinePlugin({
        // "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        "process.env.APP_VERSION": `"${appVersion}"`,
        // "process.env.LOCAL_SERVICE_URL": `"https://${config.service.hostname}:${config.service.port}"`, // only in env.development
      }),

      // index.html template
      // new rspack.HtmlRspackPlugin({ template: `index.html` }),
      indexTagHelperPlugin,

      // adds cache files to sw.js
      ...(isProduction
        ? [serviceWorkerCacheHelperPlugin]
        : [
            /** is ran from rspack.config.sw.js */
          ]),

      new rspack.ProgressPlugin({}),
      isDev ? new refreshPlugin() : null,

      new NodePolyfillPlugin(),
    ].filter(Boolean),

    devServer: {
      // server: {
      //   // https://stackoverflow.com/questions/26663404/webpack-dev-server-running-on-https-web-sockets-secure
      //   // https://webpack.js.org/configuration/dev-server/#devserverhttps
      //   type: "https",
      //   options: {
      //     key: `${config.directory.ca}${sep}${config.ca.server.key}`,
      //     cert: `${config.directory.ca}${sep}${config.ca.server.crt}`,
      //   },
      // },

      port: 8080, // Port Number
      // host: config.service.hostname, //"0.0.0.0", //external facing server
      static: [{ directory: path.resolve(__dirname, "dist") }],
    },
  };
}
