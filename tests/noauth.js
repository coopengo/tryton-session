var t = require('tap');
var _ = require('lodash');
var Session = require('..');
var data = require('./.data');
//
var session = new Session(data.server, data.database);

function testVersion() {
  return session.version()
    .then((result) => {
      t.match(result, /^4\.0\.\d/);
    });
}

function testLangs() {
  return session.listLang()
    .then((result) => {
      t.ok(_.isArray(result));
      _.each(result, (l) => {
        t.ok(_.isArray(l));
        t.isa(l[0], 'string');
        t.isa(l[1], 'string');
      });
    });
}

function testDBs() {
  return session.listDB()
    .then((result) => {
      t.ok(_.isArray(result));
      _.each(result, (db) => {
        t.isa(db, 'string');
      });
    });
}
var tests = [testVersion, testLangs, testDBs];
Promise.all(_.map(tests, t.test));
