import gulp from 'gulp'
import { info } from 'fancy-log'
import { cyan } from 'ansi-colors'
import livereload from 'gulp-livereload'
import args from './lib/args'

// In order to make chromereload work you'll need to include
// the following line in your `scipts/main.ts` file.
//
//    import 'chromereload/devonly';
//
// This will reload your extension everytime a file changes.
// If you just want to reload a specific context of your extension
// (e.g. `pages/options.html`) include the script in that context
// (e.g. `scripts/options.js`).
//
// Please note that you'll have to restart the gulp task if you
// create new file. We'll fix that when gulp 4 comes out.

gulp.task('chromereload', (cb) => {
  // This task runs only if the
  // watch argument is present!
  if (!args.watch) return cb()

  // Start livereload server
  livereload.listen({
    reloadPage: 'Extension',
    quiet: !args.verbose
  })

  info('Starting', cyan('\'livereload-server\''))

  // The watching for javascript files is done by webpack
  // Check out ./tasks/scripts.js for further info.
  gulp.watch('app/manifest.json', gulp.parallel('manifest'))
  gulp.watch('app/styles/**/*.css', gulp.parallel('styles:css'))
  gulp.watch('app/styles/**/*.less', gulp.parallel('styles:less'))
  gulp.watch('app/styles/**/*.scss', gulp.parallel('styles:sass'))
  gulp.watch('app/pages/**/*.html', gulp.parallel('pages'))
  gulp.watch('app/_locales/**/*', gulp.parallel('locales'))
  gulp.watch('app/images/**/*', gulp.parallel('images'))
  gulp.watch('app/fonts/**/*.{woff,ttf,eot,svg}', gulp.parallel('fonts'))
  gulp.watch('app/data/**/*', gulp.parallel('data'))
})
