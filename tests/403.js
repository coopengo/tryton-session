var t = require('tap')
var Session = require('..')
var data = require('./.data')

var session = new Session(data.server, data.database)

function start () {
  return session.start(data.username, data.parameters)
}

function check () {
  return session.check()
}

function breakToken () {
  session.token = '123'
}

function stop () {
  return new Promise((resolve, reject) => {
    session.stop()
      .then(
        () => reject(new Error('dummy token accepted')),
        (err) => err.status === 403 ? resolve() : reject(new Error('bad error code'))
        )
  })
}

t.test(start)
  .then(check)
  .then(breakToken)
  .then(stop)
  .catch(t.threw)
