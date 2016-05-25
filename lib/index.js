var _ = require('underscore');
require('tryton-base')(_);
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
Session.prototype.login = function (username, password) {
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
Session.prototype.loadContext = function () {
  return rpc(this, methods.getPreferences, [true], {
      context: {}
    })
    .then((result) => {
      this.context = result;
    });
};
//
Session.prototype.start = function (username, password) {
  this.reset();
  return this.login(username, password)
    .then(() => this.loadContext());
};
Session.prototype.stop = function () {
  return this.logout();
};
//
// exports
module.exports = Session;
