var Session = require('./session')
var methods = require('./methods')
var rpc = require('./rpc')

function loadContext () {
  return rpc(this, methods.getPreferences, [true], {})
    .then((result) => {
      this.context = result
      console.log(this.context)
      if (this.context.token) {
        this.user = this.context.token.user
      }

      // This may fail because the module providing this is not activated in
      // the target environment
      rpc(this, methods.userRead, [[this.user], ['network_distributors']], {})
        .then((result) => {
          this.network_distributors = result[0].network_distributors
        })
        .catch((error) => {
          this.network_distributors = []
        })
    })
}
Session.afterStart.push(loadContext)
