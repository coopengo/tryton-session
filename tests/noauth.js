var t = require('tap')
var _ = require('lodash')
var co = require('co')
var Session = require('..')
var data = require('./.data')

var session = new Session(data.server, data.database)

function version () {
  return co(function * () {
    var version = yield session.version()
    t.match(version, /^4\.4\.\d/)
  })
}

function dbs () {
  return co(function * () {
    var ds = yield session.listDB()
    t.ok(_.isArray(ds))
    _.each(ds, (d) => {
      t.isa(d, 'string')
    })
  })
}

Promise.all(_.map([version, dbs], t.test))
  .catch(t.threw)
