import requireDir from 'require-dir'
import gulp from 'gulp'
import { magenta } from 'ansi-colors'
import { info } from 'fancy-log'
import zip from 'gulp-zip'
import packageDetails from './package.json'
import args from './tasks/lib/args'

requireDir('./tasks')

gulp.task('build', gulp.series(
  'clean', gulp.parallel(
    'manifest',
    'scripts',
    'styles',
    'pages',
    'locales',
    'images',
    'fonts',
    'data',
    'chromereload',
  )
))

gulp.task('default', gulp.parallel('build'))

function getPackFileType () {
  switch (args.vendor) {
    case 'firefox':
      return '.xpi'
    default:
      return '.zip'
  }
}

gulp.task('pack', gulp.series('build', () => {
  let name = packageDetails.name
  let version = packageDetails.version
  let filetype = getPackFileType()
  let filename = `${name}-${version}-${args.vendor}${filetype}`
  return gulp.src(`dist/${args.vendor}/**/*`)
    .pipe(zip(filename))
    .pipe(gulp.dest('./packages'))
    .on('end', () => {
      let distStyled = magenta(`dist/${args.vendor}`)
      let filenameStyled = magenta(`./packages/${filename}`)
      info(`Packed ${distStyled} to ${filenameStyled}`)
    })
}))