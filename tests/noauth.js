var t = require('tap');
var _ = require('lodash');
var co = require('co');
var Session = require('..');
var data = require('./.data');
//
var session = new Session(data.server, data.database);

function version() {
  return co(function* () {
    var version = yield session.version();
    t.match(version, /^4\.0\.\d/);
  });
}

function langs() {
  return co(function* () {
    var ls = yield session.listLang();
    t.ok(_.isArray(ls));
    _.each(ls, (l) => {
      t.ok(_.isArray(l));
      t.isa(l[0], 'string');
      t.isa(l[1], 'string');
    });
  });
}

function dbs() {
  return co(function* () {
    var ds = yield session.listDB();
    t.ok(_.isArray(ds));
    _.each(ds, (d) => {
      t.isa(d, 'string');
    });
  });
}
var tests = [version, langs, dbs];
Promise.all(_.map(tests, t.test))
  .catch(t.threw);
