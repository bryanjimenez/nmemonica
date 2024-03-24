import fs from "node:fs";
import rspack from "@rspack/core";
import refreshPlugin from "@rspack/plugin-react-refresh";
import path, { sep } from "node:path";
import { fileURLToPath } from "node:url";
import LicenseCheckerWebpackPlugin from "license-checker-webpack-plugin";
import { ca } from "@nmemonica/utils/signed-ca";
import { config } from "@nmemonica/snservice";
//@ts-expect-error js instead of ts file
import { appendLicense } from "./license-writer.js";
//@ts-expect-error js instead of ts file
import { indexTagHelperPlugin } from "./pwa/plugin/indexTagger.js";
//@ts-expect-error js instead of ts file
import { serviceWorkerCacheHelperPlugin } from "./pwa/plugin/swPlugin.js";

const isDev = process.env.NODE_ENV === "development";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function rspackConfig(
  /** @type string */ _env,
  /** @type string[] */ argv
) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction && !ca.exists()) {
    ca.createServer();
  }

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
    },
    output: {
      filename: "[name].[chunkhash:8].js",
      path: path.resolve(__dirname, "dist"),
    },

    // devtool: isProduction ? false : "eval-cheap-module-source-map",
    resolve: {
      // solution for
      // 'npm link ../child-module'
      // with peerDependency
      modules: [path.resolve(__dirname, "node_modules"), "node_modules"],

      extensions: ["...", ".ts", ".tsx"],
    },
    module: {
      rules: [
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
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
                sourceMap: true,
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
              allow: "MIT OR BSD-3-Clause OR CC-BY-4.0",
              outputWriter: appendLicense,
            }),
          ]
        : []),
      // For development only
      // index.html template
      ...(!isProduction
        ? [
            new rspack.HtmlRspackPlugin({
              template: `index.html`,
            }),
          ]
        : []),

      // replacements in *code* (strings need "")
      new rspack.DefinePlugin({
        // "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        "process.env.APP_VERSION": `"${appVersion}"`,
        "process.env.LOCAL_SERVICE_URL": `"https://${config.service.hostname}:${config.service.port}"`, // only in env.development
      }),

      // adds cache files to sw.js
      ...(isProduction
        ? [indexTagHelperPlugin, serviceWorkerCacheHelperPlugin]
        : [
            /** is ran from rspack.config.sw.js */
          ]),

      new rspack.ProgressPlugin({}),
      isDev ? new refreshPlugin() : null,
    ].filter(Boolean),

    devServer: {
      server: {
        // https://stackoverflow.com/questions/26663404/webpack-dev-server-running-on-https-web-sockets-secure
        // https://webpack.js.org/configuration/dev-server/#devserverhttps
        type: "https",
        options: {
          key: `${config.directory.ca}${sep}${config.ca.server.key}`,
          cert: `${config.directory.ca}${sep}${config.ca.server.crt}`,
        },
      },

      port: config.ui.port || 8080, // Port Number
      host: config.service.hostname, //"0.0.0.0", //external facing server
      static: [{ directory: path.resolve(__dirname, "dist") }],
    },
  };
}
