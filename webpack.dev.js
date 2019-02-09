const merge = require('webpack-merge');
const {
  config,
  manifest
} = require('./webpack.common.js');

manifest.content_security_policy = "script-src 'self' 'unsafe-eval'; object-src 'self'"

module.exports = merge(config, {
  mode: 'development',
  devtool: 'eval-source-map',
  output: {
    path: __dirname + '/dist',
  },
  module: {
    rules: [{
      test: /\.(sa|sc|c)ss$/,
      loader: ['style-loader', 'css-loader', 'sass-loader'],
    }]
  },
});
