//@ts-check
import rspack from "@rspack/core";
import path, { sep } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "@nmemonica/snservice";


// https://www.rspack.dev/config/devtool.html
// https://www.rspack.dev/guide/migrate-from-webpack.html

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function rspackConfig(
  /** @type string */ _env,
  /** @type string[] */ argv
) {
  const isProduction = process.env.NODE_ENV === "production";



  return {
    entry: {
      sw: "./pwa/dist/sw.bundle.ts"
    },
    output: {
      // filename: "[name].[chunkhash:8].js",
      path: path.resolve(__dirname, "dist"),
    },

    devtool: isProduction ? false : "eval-cheap-module-source-map",

    plugins: [
     
      // replacements in *code* (strings need "")
      new rspack.DefinePlugin({
        "process.env.SERVICE_HOSTNAME": `"${config.service.hostname}"`, // only in env.development
        "process.env.SERVICE_PORT": String(config.service.port), //        env.dev only
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
      ],
    },

    optimization: {
      // chunkIds: "deterministic",
      minimize: false
    },
  };
}
