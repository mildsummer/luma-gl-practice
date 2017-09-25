const webpack = require('webpack');

module.exports = {
  entry: {
    app: "./src/app.js",
    app2: "./src/app2.js",
    app3: "./src/app3.js",
    app4: "./src/app4.js",
    app5: "./src/app5.js"
  },
  output: {
    path: './dist/',
    publicPath: '/',
    filename: "[name].js"
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ['env']
        }
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  resolve: {
    extensions: ['', '.js']
  },
  node: {
    fs: "empty"
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
};
