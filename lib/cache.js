var debug = require('debug')('tryton:session:cache')

function Cache (session) {
  this.session = session
}
Cache.prototype.get = function (model, id) {
  debug('get:', model, id)
}
Cache.prototype.set = function (model, id, record) {
  debug('set:', model, id, typeof (record))
}
module.exports = Cache
