var t = require('tap');
var _ = require('lodash');
var co = require('co');
var Session = require('..');
var data = require('./.data');
//
var session = new Session(data.server, data.database);
var cache;

function start() {
  return session.start(data.username, data.parameters);
}

function check() {
  return session.check();
}

function pack() {
  return co(function* () {
    cache = yield session.pack();
    t.isa(cache, 'string');
  });
}

function unpack() {
  return co(function* () {
    session = yield Session.unpack(cache);
    t.ok(session instanceof Session);
  });
}

function modules() {
  return co(function* () {
    var mods = yield session.rpc('model.ir.module.search_read', [
      [], 0, null, null, ['name']
    ]);
    t.ok(_.isArray(mods));
    _.each(mods, (obj) => {
      t.ok(_.isPlainObject(obj));
      t.isa(obj.id, 'number');
      t.isa(obj.name, 'string');
    });
    var mod = _.filter(mods, (obj) => {
      return obj.name === 'ir';
    });
    t.equal(_.size(mod), 1);
    mod = _.filter(mods, (obj) => {
      return obj.name === 'res';
    });
    t.equal(_.size(mod), 1);
  });
}

function crash() {
  return co(function* () {
    try {
      yield session.rpc('model.tata.juliette', []);
    }
    catch (err) {
      t.ok(_.isPlainObject(err));
      t.isa(err.error, 'string');
      t.isa(err.stack, 'string');
      return;
    }
    t.fail('error not raised');
  });
}

function stop() {
  return session.stop();
}
t.test(start)
  .then(check)
  .then(pack)
  .then(unpack)
  .then(modules)
  .then(crash)
  .then(stop)
  .catch(t.threw);
