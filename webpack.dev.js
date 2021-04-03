const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');
const {
    config,
    manifest
} = require('./webpack.common.js');

manifest.content_security_policy = "script-src 'self' http://localhost:* 'unsafe-eval'; object-src 'self'"

module.exports = merge(config, {
    mode: 'development',
    devtool: 'eval-source-map',
    output: {
        path: __dirname + '/dist',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{
                from: './node_modules/react/umd/react.development.js',
                to: 'react.js',
            },
            {
                from: './node_modules/react-dom/umd/react-dom.development.js',
                to: 'react-dom.js',
            },
            {
                from: './app/pages/options.dev.html',
                to: 'options.html',
            }]
        }),
    ]
});
