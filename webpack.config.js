import glob from "glob-all";
import HtmlWebPackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import { PurgeCSSPlugin } from "purgecss-webpack-plugin";
import webpack from "webpack";

import { fileURLToPath } from "url";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (webpackEnv, argv) {
  const envFile = /^(.*\.)(development|production)(\.js|\.json|)$/;

  return {
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          include: path.resolve(__dirname, "src"),
          use: {
            loader: "babel-loader",
          },
          // because package.json type: "module"
          // and imports don't have extensions
          // https://github.com/webpack/webpack/issues/11467#issuecomment-691873586
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.html$/,
          include: path.resolve(__dirname, "src"),
          use: {
            loader: "html-loader",
          },
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, { loader: "css-loader" }],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/,
          use: ["file-loader"],
        },
      ],
    },

    plugins: [
      new HtmlWebPackPlugin({
        template: "./index.html",
        filename: "./index.html",
      }),

      new webpack.NormalModuleReplacementPlugin(envFile, function (res) {
        // https://webpack.js.org/plugins/normal-module-replacement-plugin/
        // https://webpack.js.org/guides/environment-variables/#root
        // webpack-dev-server has requests that need to be excluded
        if (res.context.indexOf("node_modules") === -1) {
          const match = new RegExp(envFile).exec(res.request);

          // Allow in Dev Environment
          // from dev file to include prod dependency
          const envFileDev = /^(.*\.)(development)(\.js|\.json|)$/;
          const envFileProd = /^(.*\.)(production)(\.js|\.json|)$/;
          const srcFile = res.contextInfo.issuer.split("/").pop();
          const depFile = res.request;

          if (
            argv.mode === "development" &&
            new RegExp(envFileDev).test(srcFile) &&
            new RegExp(envFileProd).test(depFile)
          ) {
            const depName = res.dependencies.reduce(
              (acc, d) => (acc = !acc && d.name ? d.name : undefined),
              undefined
            );
            console.log(
              JSON.stringify({ at: srcFile, include: depName, from: depFile })
            );

            res.request = match[1] + "production" + match[3];
          } else {
            res.request = match[1] + argv.mode + match[3];
          }
        }
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename:
          argv.mode === "development"
            ? "[name].css"
            : "[name].[contenthash].css",
        chunkFilename:
          argv.mode === "development" ? "[id].css" : "[id].[contenthash].css",
      }),
      new PurgeCSSPlugin({
        paths: glob.sync(
          [path.join("index.html"), `${path.join(__dirname, "src")}/**/*`],
          { nodir: true }
        ),
        safelist: {
          standard: [
            /\bd(?:-sm|-md|-lg|-xl|-xxl){0,1}-(?:none|block|inline)\b/,
          ],
        },
      }),
    ],

    resolve: {
      extensions: [".js", ".jsx"],
    },

    output: {
      filename: "[name].[chunkhash:8].js",
    },

    // bundle splitting
    // https://medium.com/hackernoon/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // get the name. E.g. node_modules/packageName/not/this/part.js
              // or node_modules/packageName
              if (module.context.indexOf("node_modules") > -1) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )[1];

                // npm package names are URL-safe, but some servers don't like @ symbols
                return `npm.${packageName.replace("@", "")}`;
              }
            },
          },
        },
      },
    },

    devServer: {
      // contentBase: 'build/', // Relative directory for base of server
      // publicPath: '/', // Live-reload
      // inline: true,
      port: process.env.PORT || 8080, // Port Number
      host: "localhost", // Change to '0.0.0.0' for external facing server
      // historyApiFallback: true,
      static: [{ directory: path.resolve(__dirname, "dist") }],
    },
  };
}
