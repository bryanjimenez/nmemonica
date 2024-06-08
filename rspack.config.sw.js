//@ts-check
import rspack from "@rspack/core";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "@nmemonica/snservice";
//@ts-expect-error js instead of ts file
import { serviceWorkerCacheHelperPlugin } from "./pwa/plugin/swPlugin.js";

/**
 * rspack.config.sw.js is ran in DEV independently of
 * rspack.config.js to avoid hot-reload problems.
 */

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function rspackConfig(
  /** @type string */ _env,
  /** @type string[] */ argv
) {
  return {
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

    // FIXME: process.env.SW_VERSION etc replace breaks because of devtool in dev
    devtool: false,

    plugins: [
      // replacements in *code* (strings need "")
      new rspack.DefinePlugin({
        "process.env.LOCAL_SERVICE_URL": `"https://${config.service.hostname}:${config.service.port}"`,
      }),

      // adds cache files to sw.js
      serviceWorkerCacheHelperPlugin,
    ],

    // solution for
    // 'npm link ../child-module'
    // with peerDependency
    resolve: {
      modules: [path.resolve(__dirname, "node_modules"), "node_modules"],
    },

    module: {
      rules: [
        // {
        //   test: /\.css$/i,
        //   type: "css", // this is enabled by default for .css, so you don't need to specify it
        // },
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
          type: "asset/resource",
        },
      ],
    },

    optimization: {
      // chunkIds: "deterministic",
      //   minimize: false,
    },
  };
}
