const webpack = require('webpack');

module.exports = {
  entry: {
    example1: "./src/example1.js",
    example2: "./src/example2.js",
    example3: "./src/example3.js",
    example4: "./src/example4.js",
    example5: "./src/example5.js"
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
