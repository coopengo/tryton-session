var _ = require('underscore');
var btoa = require('btoa');
var request = require('superagent');
var json = require('./json');
//
function rpc(session, method, params, options) {
  var uri = session.server + '/';
  uri = session.database ? uri + session.database + '/' : uri;
  var req = request.post(uri)
    .type('json')
    .accept('json');
  options = options || {};
  if (!options.anonymous) {
    _.assert(session.username && session.user && session.token, 'not connected');
    req.set('Authorization', 'Session ' + btoa(session.username + ':' + session
      .user + ':' + session.token));
  }
  if (!_.isUndefined(options.context)) {
    if (options.context !== null) {
      params.push(options.context);
    }
  }
  else if (session.context) {
    params.push(session.context);
  }
  var body = json.toTryton({
    method: method,
    params: params
  });
  req.send(body);
  return new Promise((resolve, reject) => {
    req.end((err, res) => {
      var body;
      if (err) {
        reject(err);
      }
      else {
        body = res.body;
        if (!body) {
          reject('no body from server');
        }
        else if (body.error) {
          reject(body.error);
        }
        else {
          resolve(json.fromTryton(body.result));
        }
      }
    });
  });
}

function bulk(session, method, params, options) {
  var ids = params[0];
  params.shift();
  var bs = session.batchSize || ids.length;
  var prms = [];
  var slice;
  while (true) {
    slice = _.first(ids, bs);
    ids = _.rest(ids, bs);
    if (slice.length > 0) {
      prms.push(rpc(session, method, [slice].concat(params), options));
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
