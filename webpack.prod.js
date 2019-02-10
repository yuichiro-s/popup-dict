const merge = require('webpack-merge');

const {
  config,
  manifest
} = require('./webpack.common.js');

// currently this is necessary because v-html is used to display dictionary info in the word list
manifest.content_security_policy = "script-src 'self' 'unsafe-eval'; object-src 'self'"

module.exports = merge(config, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    path: __dirname + '/build',
  },
});
