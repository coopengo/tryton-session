var _ = require('underscore');
var btoa = require('btoa');
var request = require('superagent');
var json = require('./json');
var debug = require('debug')('api:session:rpc');
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
    _.assert(session.username && session.user && session.token, 'not connected');
    req.set('Authorization', 'Session ' + btoa(session.username + ':' + session
      .user + ':' + session.token));
  }
  if (context) {
    params = _.tail(params, 0);
    params.push(context);
  }
  var body = json.toTryton({
    method: method,
    params: params
  });
  debug(method + ': => ' + JSON.stringify(params));
  req.send(body);
  return new Promise((resolve, reject) => {
    var t = new Date();
    req.end((err, res) => {
      debug(method + ': ' + (new Date() - t) + 'ms');
      if (err) {
        debug(method + ': ko <= node error');
        reject(err);
      }
      else {
        var body;
        body = res.body;
        if (!body) {
          debug(method + ': ko <= no body');
          reject('no body from server');
        }
        else if (body.error) {
          debug(method + ': ko <= ' + body.error[0]);
          reject(body.error);
        }
        else {
          debug(method + ': ok <=');
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
    slice = _.first(ids, bs);
    ids = _.rest(ids, bs);
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
      return _.extendOwn.apply(null, results);
    });
}
//
// exports
module.exports = rpc;
rpc.bulk = bulk;
