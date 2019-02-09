const merge = require('webpack-merge');

const {
  config,
} = require('./webpack.common.js');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(config, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    path: __dirname + '/build',
  },
  plugins: [
    new MiniCssExtractPlugin(),
  ],
  module: {
    rules: [{
      test: /\.(sa|sc|c)ss$/,
      loader: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
    }]
  },
});
