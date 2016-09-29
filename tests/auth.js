var t = require('tap');
var _ = require('lodash');
var Session = require('..');
var data = require('./.data');
//
var session = new Session(data.server, data.database);
var cache;

function start() {
  return session.start(data.username, data.password);
}

function stop() {
  return session.stop();
}

function check() {
  return session.check();
}

function pack() {
  return session.pack()
    .then((c) => {
      t.isa(c, 'string');
      cache = c;
    });
}

function unpack() {
  return Session.unpack(cache)
    .then((s) => {
      t.ok(s instanceof Session);
      session = s;
    });
}

function listModules() {
  return session.rpc('model.ir.module.search_read', [
      [], 0, null, null, ['name']
    ])
    .then((result) => {
      t.ok(_.isArray(result));
      result.forEach((obj) => {
        t.ok(_.isPlainObject(obj));
        t.isa(obj.id, 'number');
        t.isa(obj.name, 'string');
      });
      var ir_module = _.filter(result, (obj) => {
        return obj.name === 'ir';
      });
      t.ok(_.isArray(ir_module));
      t.equal(_.size(ir_module), 1);
      var res_module = _.filter(result, (obj) => {
        return obj.name === 'res';
      });
      t.ok(_.isArray(res_module));
      t.equal(_.size(res_module), 1);
    });
}
t.test(start)
  .then(check)
  .then(pack)
  .then(unpack)
  .then(listModules)
  .then(stop);
