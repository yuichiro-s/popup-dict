import gulp from 'gulp'
import gulpif from 'gulp-if'
import livereload from 'gulp-livereload'
import args from './lib/args'

gulp.task('data', () => {
  return gulp.src('app/data/**/*')
    .pipe(gulp.dest(`dist/${args.vendor}/data`))
    .pipe(gulpif(args.watch, livereload()))
})
