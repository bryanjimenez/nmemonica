const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = function (webpackEnv, argv) {
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
          res.request = match[1] + argv.mode + match[3];
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
      // contentBase: 'build/', // Relative directory for base of server
      // publicPath: '/', // Live-reload
      // inline: true,
      port: process.env.PORT || 8080, // Port Number
      host: "localhost", // Change to '0.0.0.0' for external facing server
      // historyApiFallback: true,
    },
  };
};
