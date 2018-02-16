var t = require('tap')
var Session = require('..')
var data = require('./.data')

var session = new Session(data.server, data.database)
var rpc = require('./.rpc')(session)

const start = async () => {
  await session.start(data.username, {password: data.password})
}

const stop = async () => {
  await session.stop()
}

t.test(start)
  .then(rpc.check)
  .then(rpc.pack)
  .then(rpc.unpack)
  .then(rpc.modules)
  .then(rpc.crash)
  .then(stop)
  .catch(t.threw)
