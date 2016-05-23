var path = require('path');
var del = require('del');
var fs = require('fs');
var gulp = require('gulp');
var changed = require('gulp-changed');
var jsbeautifier = require('gulp-jsbeautifier');
var jshint = require('gulp-jshint');
//
var lastExecFileName = path.join(__dirname, '.check');
var lastExec;

function lastExecToFile() {
  var now = new Date();
  return new Promise((resolve, reject) => {
    fs.writeFile(lastExecFileName, now.getTime(), (err) => {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
}

function hasChanged(stream, cb, sourceFile) {
  if (!lastExec || sourceFile.stat.mtime > lastExec) {
    stream.push(sourceFile);
  }
  cb();
}

function check(what) {
  return gulp.src(gulp.paths[what].src)
    .pipe(changed(gulp.paths[what].dest, {
      hasChanged: hasChanged
    }))
    .pipe(jsbeautifier({
      config: gulp.paths[what].jsbeautifyrc,
    }))
    .pipe(jsbeautifier.reporter())
    .pipe(jshint(gulp.paths[what].jshintrc))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest(gulp.paths[what].dest));
}
var checkLib = check.bind(null, 'lib');
var checkMocha = check.bind(null, 'mocha');
//
gulp.task('check:before', () => {
  if (lastExec) {
    return Promise.resolve();
  }
  else {
    return new Promise((resolve, reject) => {
      fs.readFile(lastExecFileName, (err, data) => {
        if (err) {
          if (/ENOENT: no such file or directory/.test(err.message)) {
            lastExec = null;
            resolve();
          }
          else {
            reject(err);
          }
        }
        else {
          lastExec = new Date(parseInt(data));
          resolve();
        }
      });
    });
  }
});
gulp.task('check:forget', () => {
  return del([lastExecFileName]);
});
gulp.task('check:lib', ['check:before'], checkLib);
gulp.task('check:mocha', ['check:before'], checkMocha);
gulp.task('check:force:lib', ['check:forget'], checkLib);
gulp.task('check:force:mocha', ['check:forget'], checkMocha);
//
gulp.task('check', ['check:lib', 'check:mocha'], () => {
  return lastExecToFile();
});
gulp.task('check:force', ['check:force:lib', 'check:force:mocha'], () => {
  return lastExecToFile();
});
