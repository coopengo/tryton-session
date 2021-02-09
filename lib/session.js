var _ = require('lodash')
var inherits = require('inherits')
var EventEmitter = require('events')
var btoa = require('btoa')
var Cache = require('./cache')
var rpc = require('./rpc')
var methods = require('./methods')

function appendActions (promise, actions) {
  _.each(actions, (act) => {
    if (_.isArray(act)) {
      promise = promise.then(() => Promise.all(_.map(act, (subAct) =>
        subAct.call(this))))
    } else {
      promise = promise.then(() => act.call(this))
    }
  })
  return promise
}

function Session (server, database, token) {
  if (_.isPlainObject(server)) {
    _.assign(this, _.pick(server, _.keys(Session.serializable)))
  } else {
    this.server = server
    this.database = database
    this.token = token
    this.batchSize = 100
  }
  this.setMaxListeners(Infinity)
  this.cache = new Cache(this)
}
inherits(Session, EventEmitter)

Session.prototype.identity = function () {
  if (this.token) {
    return this.database + ':' + this.token
  } else if (this.user) {
    return this.database + ':' + this.user
  } else {
    throw new Error('not connected')
  }
}

Session.prototype.setContext = function (key, value) {
  if (_.isNil(key)) {
    this.context = null
  } else {
    if (!this.context) {
      this.context = {}
    }
    if (_.isString(key)) {
      this.context[key] = value
    } else if (_.isPlainObject(key)) {
      _.assign(this.context, key)
    }
  }
}

Session.serialize = JSON.stringify
Session.unserialize = JSON.parse
Session.serializable = {
  server: false,
  database: false,
  batchSize: false,
  token: false,
  username: true,
  user: true,
  session: true,
  context: true,
  network_distributors: true,
}

Session.prototype.reset = function () {
  _.each(_.keys(_.pickBy(Session.serializable)), (k) => {
    this[k] = null
  })
}

Session.prototype.authorization = function () {
  if (this.token) {
    return 'Token ' + this.token
  } else if (this.username && this.user && this.session) {
    return 'Session ' + btoa(this.username + ':' + this.user + ':' + this.session)
  } else {
    throw new Error('not connected')
  }
}

Session.prototype.rpc = function (method, params, context, forceContext) {
  if (forceContext) {
    return rpc(this, method, params, context)
  } else {
    return rpc(this, method, params, _.assign(this.context, context))
  }
}

Session.prototype.bulk = function (method, params, context, forceContext) {
  if (forceContext) {
    return rpc.bulk(this, method, params, context)
  } else {
    return rpc.bulk(this, method, params, _.assign(this.context, context))
  }
}

Session.prototype.version = function () {
  return rpc(this, methods.version, [], null, {
    nodb: true,
    anonymous: true
  })
}

Session.prototype.listDB = function () {
  return rpc(this, methods.listDB, [], null, {
    nodb: true,
    anonymous: true
  })
}

Session.prototype.login = function (username, parameters, language) {
  return rpc(this, methods.login, [username, parameters, language], null, {
    anonymous: true
  })
    .then((result) => {
      this.username = username
      this.user = result[0]
      this.session = result[1]
    })
}

Session.prototype.logout = function () {
  return this.rpc(methods.logout, [], null, true)
}

Session.prototype.check = function () {
  return this.rpc(methods.getPreferences, [true], {}, true)
    .then(() => true, () => false)
}

Session.afterStart = []
Session.beforeStop = []
Session.prototype.start = function (username, parameters, language) {
  this.reset()
  var promise
  if (this.token) {
    promise = Promise.resolve()
  } else {
    promise = this.login(username, parameters, language)
  }
  return appendActions.call(this, promise, Session.afterStart)
    .then(() => this.emit('start'))
}

Session.prototype.stop = function () {
  var gen
  if (this.token) {
    gen = () => Promise.resolve()
  } else {
    gen = () => this.logout()
  }
  return appendActions.call(this, Promise.resolve(), Session.beforeStop)
    .then(gen)
    .then(() => this.reset())
    .then(() => this.emit('stop'))
}

Session.beforePack = []
Session.afterUnpack = []
Session.prototype.pack = function () {
  return appendActions.call(this, Promise.resolve(), Session.beforePack)
    .then(() => {
      var r = Session.serialize(_.pick(this, _.keys(Session.serializable)))
      this.emit('pack')
      return r
    })
}

Session.unpack = function (raw) {
  var session = new Session(Session.unserialize(raw))
  return appendActions.call(session, Promise.resolve(), Session.afterUnpack)
    .then(() => {
      session.emit('unpack')
      return session
    })
}

Session.isRPCError = function (error) {
  return error instanceof rpc.Error
}
Session.isRPCForbidden = function (error) {
  return Session.isRPCError(error) &&
    (error.status === 403 || error.status === 401)
}

module.exports = Session
