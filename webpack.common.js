const VueLoaderPlugin = require('vue-loader/lib/plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const fs = require('fs');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
manifest = JSON.parse(fs.readFileSync('app/manifest.json'));

module.exports = {
  config: {
    entry: {
      background: './app/scripts/background.ts',
      content: './app/scripts/content.ts',
      options: './app/scripts/options.ts',
      'eijiro.worker': './app/scripts/preprocess/eijiro.worker.ts',
    },
    target: 'web',
    plugins: [
      new VueLoaderPlugin(),
      new CopyWebpackPlugin([
        './app/pages/options.html',
        {
          from: './app/images',
          to: 'images',
        },
        {
          from: './app/_locales',
          to: '_locales',
        },
      ]),
      new GenerateJsonPlugin('manifest.json', manifest),
    ],
    module: {
      rules: [{
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            appendTsSuffixTo: [/\.vue$/],
          }
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              'scss': 'vue-style-loader!css-loader!sass-loader',
              'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
            },
          }
        },
        {
          test: /\.(png|woff|woff2|eot|ttf|svg)$/,
          loader: 'url-loader'
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js', '.vue'],
      modules: [
        'node_modules/',
        'app/scripts/',
      ],
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        'handlebars': 'handlebars/dist/handlebars.js',
      }
    }
  },
  manifest,
};
