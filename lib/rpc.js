var _ = require('lodash');
var assert = require('assert');
var btoa = require('btoa');
var request = require('superagent');
var json = require('./json');
var debug = require('debug')('tryton:session:rpc');
//
function rpc(session, method, params, context, options) {
  options = options || {};
  var uri = session.server + '/';
  if (!options.nodb) {
    uri = uri + session.database + '/';
  }
  var req = request.post(uri)
    .type('json')
    .accept('json');
  if (!options.anonymous) {
    assert(session.username && session.user && session.token, 'not connected');
    req.set('Authorization', 'Session ' + btoa(session.username + ':' + session
      .user + ':' + session.token));
  }
  if (context) {
    params = _.slice(params);
    params.push(context);
  }
  var body = json.toTryton({
    method: method,
    params: params
  });
  debug(method + ': =>');
  req.send(body);
  return new Promise((resolve, reject) => {
    req.end((err, res) => {
      if (err) {
        debug(method + ': <= ko - node error');
        reject(err);
      }
      else {
        var body;
        body = res.body;
        if (!body) {
          debug(method + ': <= ko - no body');
          reject('no body from server');
        }
        else if (body.error) {
          debug(method + ': <= ko - ' + body.error[0]);
          reject(body.error);
        }
        else {
          debug(method + ': <= ok');
          resolve(json.fromTryton(body.result));
        }
      }
    });
  });
}

function bulk(session, method, params, context, options) {
  var ids = params[0];
  params.shift();
  var bs = session.batchSize || ids.length;
  var prms = [];
  var slice;
  while (true) {
    slice = _.take(ids, bs);
    ids = _.drop(ids, bs);
    if (slice.length > 0) {
      prms.push(rpc(session, method, [slice].concat(params), context, options));
    }
    else {
      break;
    }
  }
  return Promise.all(prms)
    .then((results) => {
      results.unshift({});
      return _.assign.apply(null, results);
    });
}
//
// exports
module.exports = rpc;
rpc.bulk = bulk;
