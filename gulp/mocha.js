var gulp = require('gulp');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
//
gulp.task('mocha', () => {
  return gulp.src(gulp.paths.mocha.main, {
      read: false
    })
    .pipe(mocha({
      reporter: 'nyan'
    }))
    .once('error', (err) => {
      gutil.log(err);
      process.exit(1);
    })
    .once('end', () => {
      process.exit();
    });
});
