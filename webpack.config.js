// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const  webpack = require('webpack');
const isProduction = process.env.NODE_ENV == "development";

const config = {
 // devtool: 'inline-source-map',
  entry: {

    'game-build': ['./scripts/logic.js','./scripts/ui_handle.js'],
   

  },
  output: {
    path: __dirname + "/build/",
  },
  devServer: {
    open: true,
    host: "localhost",
  },
  plugins: [
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    new webpack.DefinePlugin({
      'process.env':JSON.stringify(process.env)
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },
      {
        test: /\.m?js$/,
        //exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
