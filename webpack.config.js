const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.html$/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: "html-loader"
        }
      },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        use: ["file-loader"]
      }
    ]
  },

  plugins: [
    new HtmlWebPackPlugin({
      template: "./index.html",
      filename: "./index.html"
    })
  ],

  resolve: {
    extensions: [".js", ".jsx"]
  },

  devServer: {
    // contentBase: 'build/', // Relative directory for base of server
    // publicPath: '/', // Live-reload
    // inline: true,
    port: process.env.PORT || 8080, // Port Number
    host: "localhost" // Change to '0.0.0.0' for external facing server
    // historyApiFallback: true,
  }
};
