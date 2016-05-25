var _ = require('underscore');
require('tryton-base')(_);
var rpc = require('./rpc');
//
var methods = {
  version: 'common.server.version',
  listLang: 'common.db.list_lang',
  listDB: 'common.db.list',
  login: 'common.db.login',
  logout: 'common.db.logout',
  getPreferences: 'model.res.user.get_preferences',
};

function reset() {
  this.username = null;
  this.user = null;
  this.session = null;
  this.context = null;
  this.batchSize = 100;
}

function Session(server, database) {
  if (_.isObject(server)) {
    _.extendOwn(this, _.pick(server, Session.serializable));
  }
  else {
    this.server = server;
    this.database = database;
    reset.call(this);
  }
}
Session.serializable = ['server', 'database', 'username', 'user', 'session',
  'context', 'batchSize'
];
Session.prototype.reset = reset;
Session.prototype.serialize = function () {
  return JSON.stringify(_.pick(this, Session.serializable));
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
    anonymous: true
  });
};
Session.prototype.listLang = function () {
  return rpc(this, methods.listLang, [], {
    anonymous: true
  });
};
Session.prototype.listDB = function () {
  return rpc(this, methods.listDB, [], {
    anonymous: true
  });
};
Session.prototype.login = function (username, password) {
  return rpc(this, methods.login, [username, password], {
      anonymous: true
    })
    .then((result) => {
      if (result) {
        this.username = username;
        this.user = result[0];
        this.session = result[1];
      }
      else {
        Promise.reject('login failed');
      }
    });
};
Session.prototype.logout = function () {
  this.context = null;
  return this.rpc(methods.logout, [])
    .then(() => this.reset());
};
Session.prototype.loadContext = function () {
  this.context = null;
  return this.rpc(methods.getPreferences, [true], {})
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
