module.exports = {
  entry: './lib/index.js',
  externals: {
    'underscore': '_',
    'moment': 'moment'
  },
  output: {
    path: './dist',
    filename: 'tryton-session.js',
    libraryTarget: 'var',
    library: 'Session'
  }
};
