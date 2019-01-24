import gulp from 'gulp'
import gulpif from 'gulp-if'
import { cyan } from 'ansi-colors'
import { info } from 'fancy-log'
import named from 'vinyl-named'
import webpack from 'webpack'
import gulpWebpack from 'webpack-stream'
import plumber from 'gulp-plumber'
import livereload from 'gulp-livereload'
import args from './lib/args'

const ENV = args.production ? 'production' : 'development'

import VueLoaderPlugin from 'vue-loader/lib/plugin'

gulp.task('scripts', (cb) => {
  return gulp.src([
      'app/scripts/background.ts',
      'app/scripts/content.ts',
      'app/scripts/options.ts',
    ])
    .pipe(plumber({
      // Webpack will log the errors
      errorHandler() {}
    }))
    .pipe(named())
    .pipe(gulpWebpack({
        mode: 'development',
        devtool: args.sourcemaps ? 'inline-source-map' : false,
        watch: args.watch,
        plugins: [
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(ENV),
            'process.env.VENDOR': JSON.stringify(args.vendor)
          }),
          new VueLoaderPlugin(),
        ].concat(args.production ? [
          //new webpack.optimize.UglifyJsPlugin(),
          new webpack.optimize.ModuleConcatenationPlugin()
        ] : []),
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
              test: /\.css$/,
              loader: ['style-loader', 'css-loader'],
            },
          ]
        },
        resolve: {
          extensions: ['.ts', '.js', '.vue'],
          modules: [
            'node_modules/',
            'app/scripts/',
          ],
          alias: {
              'vue$': 'vue/dist/vue.esm.js'
          }
        }
      },
      webpack,
      (err, stats) => {
        if (err) return
        info(`Finished '${cyan('scripts')}'`, stats.toString({
          chunks: false,
          colors: true,
          cached: false,
          children: false
        }))
      }))
    .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(gulpif(args.watch, livereload()))
})
