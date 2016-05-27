var _ = require('underscore');
var rpc = require('./rpc');
var methods = require('./methods');

function Session(server, database) {
  if (_.isObject(server)) {
    _.extendOwn(this, _.pick(server, _.keys(Session.serializable)));
  }
  else {
    this.server = server;
    this.database = database;
    this.batchSize = 100;
  }
}
//
// serialization (supporting modules plugging)
Session.serializable = {
  server: false,
  database: false,
  batchSize: false,
  username: true,
  user: true,
  session: true,
  context: true
};
Session.prototype.serialize = function () {
  return JSON.stringify(_.pick(this, _.keys(Session.serializable)));
};
Session.prototype.reset = function () {
  _.each(_.keys(_.objFilter(Session.serializable)), (k) => {
    this[k] = null;
  });
};
//
// triggers (supporting modules plugging)
Session.afterLogin = [];
Session.beforeLogout = [];

function appendActions(promise, actions) {
  _.each(actions, (act) => {
    if (_.isArray(act)) {
      promise = promise.then(() => Promise.all(_.map(act, (subAct) => subAct.call(
        this))));
    }
    else {
      promise = promise.then(() => act.call(this));
    }
  });
  return promise;
}
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
// basic server actions with no effect on session
Session.prototype.version = function () {
  return rpc(this, methods.version, [], {
    anonymous: true,
    context: null
  });
};
Session.prototype.listLang = function () {
  return rpc(this, methods.listLang, [], {
    anonymous: true,
    context: null
  });
};
Session.prototype.listDB = function () {
  return rpc(this, methods.listDB, [], {
    anonymous: true,
    context: null
  });
};
//
// basic server actions with effect on session
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
        Promise.reject('login failed');
      }
    });
};
Session.prototype.logout = function () {
  return rpc(this, methods.logout, [], {
      context: null
    })
    .then(() => this.reset());
};
//
// session main actions
Session.prototype.start = function (username, password) {
  return appendActions.call(this, this.login(username, password), Session.afterLogin);
};
Session.prototype.stop = function () {
  return appendActions.call(this, Promise.resolve(), Session.beforeLogout)
    .then(() => this.logout());
};
//
// exports
module.exports = Session;
