var gulp = require('gulp');
gulp.paths = {
  lib: {
    src: ['./**/*.{js,json}', '!./package.json', '!./node_modules/**',
      '!./mocha/**'
    ],
    dest: '.',
    jshintrc: './.jshintrc',
    jsbeautifyrc: './.jsbeautifyrc',
  },
  mocha: {
    src: ['./mocha/*.js', './mocha/.*.js'],
    dest: './mocha',
    jshintrc: './mocha/.jshintrc',
    jsbeautifyrc: './.jsbeautifyrc',
    main: ['./mocha/*.js'],
  }
};
require('require-dir')('./gulp');
gulp.task('default', ['check']);
