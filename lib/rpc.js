var _ = require('lodash');
var assert = require('assert');
var inherits = require('inherits');
var btoa = require('btoa');
var request = require('superagent');
var json = require('./json');
var debug = require('debug')('tryton:session:rpc');
//
function RPCError(status, message, tb) {
  Error.call(this, message);
  this.status = parseInt(status);
  this.message = message;
  this.tb = tb;
}
inherits(RPCError, Error);
RPCError.prototype.toString = function () {
  return 'RPC Error (' + this.status + '): ' + this.message;
};

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
        if (err.status) {
          reject(new RPCError(res.status, err.response.text));
        }
        else {
          reject(err);
        }
      }
      else {
        var body = res.body;
        if (!body) {
          debug('%d: <= ko - no body', id);
          reject(new RPCError(res.status, 'no body from server'));
        }
        else if (body.error) {
          debug('%d: <= ko - %s', id, body.error[0]);
          var status, message, tb;
          if (body.error[0].match(/\d\d\d:/)) {
            status = body.error[0].substr(0, 3);
            message = body.error[0].substr(4);
            tb = body.error[1];
          }
          else {
            status = 0;
            if (body.error[0] === 'UserError') {
              message = body.error[1][0];
            }
            else {
              message = body.error[0];
              tb = body.error[1];
            }
          }
          reject(new RPCError(status, message, tb));
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
rpc.Error = RPCError;
