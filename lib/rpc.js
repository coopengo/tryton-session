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
  var id = Math.floor(Math.random() * 1000000);
  var body = json.toTryton({
    method: method,
    params: params,
    id: id
  });
  debug('%d: => %s', id, method);
  req.send(body);
  return new Promise((resolve, reject) => {
    req.end((err, res) => {
      if (err) {
        debug('%d: <= ko - node error', id);
        reject({
          status: err.status,
          error: err.message,
          stack: err.stack
        });
      }
      else {
        var body = res.body;
        if (!body) {
          debug('%d: <= ko - no body', id);
          reject('no body from server');
        }
        else if (body.error) {
          debug('%d: <= ko - %s', id, body.error[0]);
          var e = {
            stack: body.error[1]
          };
          if (body.error[0].match(/\d\d\d:/)) {
            e.status = parseInt(body.error[0].substr(0, 3));
            e.error = body.error[0].substr(4);
          }
          else {
            e.error = body.error[0];
          }
          reject(e);
        }
        else {
          debug('%d: <= ok', id);
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
