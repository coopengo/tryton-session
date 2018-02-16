var t = require('tap')
var _ = require('lodash')
var Session = require('..')
var data = require('./.data')

var VERSION = require('../package.json').version.split('.')

var session = new Session(data.server, data.database)

const version = async () => {
  var version = await session.version()
  version = version.split('.')
  t.equal(version[0], VERSION[0])
  t.equal(version[1], VERSION[1])
}

const dbs = async () => {
  var ds = await session.listDB()
  t.ok(_.isArray(ds))
  _.each(ds, (d) => {
    t.isa(d, 'string')
  })
}

t.test(version)
  .then(dbs)
  .then(t.end, t.threw)
