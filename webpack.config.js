module.exports = {
  entry: './lib/index.js',
  externals: {
    'lodash': '_',
    'moment': 'moment'
  },
  output: {
    path: './dist',
    filename: 'tryton-session.js',
    libraryTarget: 'var',
    library: 'Session'
  }
};
