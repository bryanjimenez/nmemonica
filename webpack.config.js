const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const ignoredFiles = require("react-dev-utils/ignoredFiles");

const webpackDevClientEntry = require.resolve(
  "react-dev-utils/webpackHotDevClient"
);
const reactRefreshOverlayEntry = require.resolve(
  "react-dev-utils/refreshOverlayInterop"
);

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebook/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const appNodeModules = resolveApp("node_modules");
const appSrc = resolveApp("src");
const publicUrlOrPath = require(resolveApp("package.json")).homepage;

module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";

  return {
    module: {
      rules: [
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/,
          use: ["file-loader"],
        },
        {
          test: /\.(js|jsx)$/,
          // exclude: /node_modules/,
          include: path.resolve(__dirname, "src"),
          loader: require.resolve("babel-loader"),
          options: {
            customize: require.resolve(
              "babel-preset-react-app/webpack-overrides"
            ),
            // This is a feature of `babel-loader` for webpack (not Babel itself).
            // It enables caching results in ./node_modules/.cache/babel-loader/
            // directory for faster rebuilds.
            cacheDirectory: true,
            // See #6846 for context on why cacheCompression is disabled
            cacheCompression: false,
            compact: isEnvProduction,
            plugins: [
              [
                require.resolve("babel-plugin-named-asset-import"),
                {
                  loaderMap: {
                    svg: {
                      ReactComponent:
                        "@svgr/webpack?-svgo,+titleProp,+ref![path]",
                    },
                  },
                },
              ],

              isEnvDevelopment && require.resolve("react-refresh/babel"),
            ].filter(Boolean),
          },
        },
        {
          test: /\.html$/,
          include: path.resolve(__dirname, "src"),
          loader: "html-loader",
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                sourceMap: false,
              },
            },
          ],
        },
      ],
    },

    plugins: [
      new HtmlWebPackPlugin({
        template: "./index.html",
        filename: "./index.html",
      }),

      // This is necessary to emit hot updates (CSS and Fast Refresh):
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
      // Experimental hot reloading for React .
      // https://github.com/facebook/react/tree/master/packages/react-refresh
      isEnvDevelopment &&
        new ReactRefreshWebpackPlugin({
          overlay: {
            entry: webpackDevClientEntry,
            // The expected exports are slightly different from what the overlay exports,
            // so an interop is included here to enable feedback on module-level errors.
            module: reactRefreshOverlayEntry,
            // Since we ship a custom dev client and overlay integration,
            // the bundled socket handling logic can be eliminated.
            sockIntegration: false,
          },
        }),

      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebook/create-react-app/issues/186
      isEnvDevelopment && new WatchMissingNodeModulesPlugin(appNodeModules),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      new ManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
            (fileName) => !fileName.endsWith(".map")
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ].filter(Boolean),

    performance: false,

    resolve: {
      extensions: [".js", ".jsx"],
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
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];

              // npm package names are URL-safe, but some servers don't like @ symbols
              return `npm.${packageName.replace("@", "")}`;
            },
          },
        },
      },
    },
    devServer: {
      hot: true,
      // contentBase: './build/', // Relative directory for base of server
      contentBase: path.join(__dirname, "dist"),
      // publicPath: '/', // Live-reload
      // inline: true,
      port: process.env.PORT || 8080, // Port Number
      host: "localhost", // Change to '0.0.0.0' for external facing server
      disableHostCheck: true,
      // historyApiFallback: true,
      clientLogLevel: "none",
      // Prevent a WS client from getting injected as we're already including
      // `webpackHotDevClient`.
      injectClient: false,
      // Reportedly, this avoids CPU overload on some systems.
      // https://github.com/facebook/create-react-app/issues/293
      // src/node_modules is not ignored to support absolute imports
      // https://github.com/facebook/create-react-app/issues/1065
      watchOptions: {
        ignored: ignoredFiles(appSrc),
      },
    },
  };
};
