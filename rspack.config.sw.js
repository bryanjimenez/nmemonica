import rspack from "@rspack/core";
import path from "node:path";
import { fileURLToPath } from "node:url";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import { serviceWorkerCacheHelperPlugin } from "./pwa/plugin/swPlugin.js";

/**
 * rspack.config.sw.js is ran in DEV independently of
 * rspack.config.js to avoid hot-reload problems.
 */

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nodeModulesDir = path.resolve(__dirname, "node_modules");

export default function rspackConfig(
  /** @type string */ _env,
  /** @type string[] */ argv
) {
  return {
    context: __dirname,
    entry: {
      main: "./src/index.tsx",
      sw: {
        filename: "sw.js",
        import: "./pwa/src/sw.ts",
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

    resolve: {
      // solution for
      // 'npm link ../child-module'
      // with peerDependency
      modules: [nodeModulesDir, "node_modules"],

      extensions: ["...", ".js", ".ts", ".tsx"],
      fallback: {
        fs: false,
        crypto: path.normalize(nodeModulesDir + path.sep + "crypto-browserify"),
        stream: path.normalize(nodeModulesDir + path.sep + "stream-browserify"),
      },
    },
    module: {
      rules: [
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
          type: "asset/resource",
        },
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
      // replacements in *code* (strings need "")
      // new rspack.DefinePlugin({
      //   "process.env.LOCAL_SERVICE_URL": `"https://${config.service.hostname}:${config.service.port}"`,
      // }),

      // adds cache files to sw.js
      serviceWorkerCacheHelperPlugin,

      new rspack.ProgressPlugin({}),
      new NodePolyfillPlugin(),
    ].filter(Boolean),
  };
}
