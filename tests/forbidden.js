var t = require('tap')
var Session = require('..')
var data = require('./.data')

var session = new Session(data.server, data.database)

function start () {
  return session.start(data.username, {password: data.password})
}

function check () {
  return session.check()
}

function breakToken () {
  session.session = '123'
}

function stop () {
  return new Promise((resolve, reject) => {
    session.stop()
      .then(
        () => reject(new Error('dummy session accepted')),
        (err) => {
          t.assert(Session.isRPCForbidden(err), 'bad error type')
        })
  })
}

t.test(start)
  .then(check)
  .then(breakToken)
  .then(stop)
  .catch(t.threw)
