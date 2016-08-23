var _ = require('underscore');
var EventEmitter = require('events');
var rpc = require('./rpc');
var methods = require('./methods');

function appendActions(promise, actions) {
  _.each(actions, (act) => {
    if (_.isArray(act)) {
      promise = promise.then(() => Promise.all(_.map(act, (subAct) =>
        subAct.call(this))));
    }
    else {
      promise = promise.then(() => act.call(this));
    }
  });
  return promise;
}

function Session(server, database) {
  if (_.isObject(server)) {
    _.extendOwn(this, _.pick(server, _.keys(Session.serializable)));
  }
  else {
    this.server = server;
    this.database = database;
    this.batchSize = 100;
  }
  this.setMaxListeners(Infinity);
}
_.inherit(Session, EventEmitter);
//
// serialization
Session.serialize = JSON.stringify;
Session.unserialize = JSON.parse;
Session.serializable = {
  server: false,
  database: false,
  batchSize: false,
  username: true,
  user: true,
  token: true,
  context: true
};
Session.prototype.reset = function () {
  _.each(_.keys(_.objFilter(Session.serializable)), (k) => {
    this[k] = null;
  });
};
//
// rpc wrappers
Session.prototype.rpc = function (method, params, context) {
  if (context) {
    return rpc(this, method, params, {
      context: context
    });
  }
  else {
    return rpc(this, method, params);
  }
};
Session.prototype.bulk = function (method, params, context) {
  if (context) {
    return rpc.bulk(this, method, params, {
      context: context
    });
  }
  else {
    return rpc.bulk(this, method, params);
  }
};
//
// basic server actions (do not change session)
Session.prototype.version = function () {
  return rpc(this, methods.version, [], {
    nodb: true,
    anonymous: true,
    context: null
  });
};
Session.prototype.listLang = function () {
  return rpc(this, methods.listLang, [], {
    nodb: true,
    anonymous: true,
    context: null
  });
};
Session.prototype.listDB = function () {
  return rpc(this, methods.listDB, [], {
    nodb: true,
    anonymous: true,
    context: null
  });
};
//
// basic actions
Session.prototype.login = function (username, password) {
  this.reset();
  return rpc(this, methods.login, [username, password], {
      anonymous: true,
      context: null
    })
    .then((result) => {
      if (result) {
        this.username = username;
        this.user = result[0];
        this.token = result[1];
      }
      else {
        return Promise.reject('login failed');
      }
    });
};
Session.prototype.logout = function () {
  return rpc(this, methods.logout, [], {
      context: null
    })
    .then(() => this.reset());
};
Session.prototype.check = function () {
  return rpc(this, methods.getPreferences, [true], {
      context: {}
    })
    .then(() => true, () => false);
};
//
// main api - start and stop (supports trigging actions)
Session.afterLogin = [];
Session.beforeLogout = [];
Session.prototype.start = function (username, password) {
  return appendActions.call(this, this.login(username, password), Session.afterLogin)
    .then(() => this.emit('start'));
};
Session.prototype.stop = function () {
  return appendActions.call(this, Promise.resolve(), Session.beforeLogout)
    .then(() => this.logout())
    .then(() => this.emit('stop'));
};
//
// packing (supports trigging actions)
Session.beforePack = [];
Session.afterUnpack = [];
Session.prototype.pack = function () {
  return appendActions.call(this, Promise.resolve(), Session.beforePack)
    .then(() => {
      var r = Session.serialize(_.pick(this, _.keys(Session.serializable)));
      this.emit('pack');
      return r;
    });
};
Session.unpack = function (raw) {
  var session = new Session(Session.unserialize(raw));
  return appendActions.call(session, Promise.resolve(), Session.afterUnpack)
    .then(() => {
      session.emit('unpack');
      return session;
    });
};
//
// exports
module.exports = Session;
