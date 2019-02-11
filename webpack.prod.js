const CopyWebpackPlugin = require('copy-webpack-plugin');
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
  plugins: [
    new CopyWebpackPlugin([{
        from: './node_modules/react/umd/react.production.min.js',
        to: 'react.js',
      },

      {
        from: './node_modules/react-dom/umd/react-dom.production.min.js',
        to: 'react-dom.js',
      },
      {
        from: './app/pages/options.prod.html',
        to: 'options.html',
      }
    ]),
  ]
});
