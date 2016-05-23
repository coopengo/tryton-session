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
  get_preferences: 'model.res.user.get_preferences',
  list_models: 'model.ir.model.list_models',
  get_access: 'model.ir.model.access.get_access',
};

function reset() {
  this.username = null;
  this.user = null;
  this.session = null;
  this.context = null;
  this.access = null;
  this.batchSize = 100;
}

function Session(server, database) {
  this.server = server;
  this.database = database;
  reset.call(this);
}
Session.prototype.reset = reset;
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
      this.username = username;
      this.user = result[0];
      this.session = result[1];
    });
};
Session.prototype.logout = function () {
  this.context = null;
  return this.rpc(methods.logout, [])
    .then(() => this.reset());
};
Session.prototype.load_context = function () {
  this.context = null;
  return this.rpc(methods.get_preferences, [true], {})
    .then((result) => {
      this.context = result;
    });
};
Session.prototype.load_access = function () {
  this.access = null;
  return this.rpc(methods.list_models, [])
    .then(models => this.bulk(methods.get_access, [models]))
    .then((result) => {
      this.access = result;
    });
};
Session.prototype.start = function (username, password) {
  this.reset();
  return this.login(username, password)
    .then(() => this.load_context())
    .then(() => this.load_access());
};
Session.prototype.stop = function () {
  return this.logout();
};
//
// exports
module.exports = Session;
