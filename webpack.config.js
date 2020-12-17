const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");

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
          use: [{ loader: "style-loader" }, { loader: "css-loader" }],
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
    ],

    resolve: {
      extensions: [".js", ".jsx"],
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
