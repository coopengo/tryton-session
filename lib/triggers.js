var Session = require('./session')
var methods = require('./methods')
var rpc = require('./rpc')

function loadContext () {
  return rpc(this, methods.getPreferences, [true], {})
    .then((result) => {
      this.context = result
      if (this.context.token) {
        this.user = this.context.token.user
      }
    })
}
Session.afterStart.push(loadContext)
