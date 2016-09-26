var _ = require('underscore');
var moment = require('moment');
var isEqual = _.isEqual;
_.mixin({
  'inherit': function (child, base) {
    child.prototype = _.create(base.prototype, _.assign({
      'constructor': child,
      '__': base.prototype,
    }, child.prototype));
    return child;
  },
  'assert': function (cond, msg) {
    if (!cond) {
      throw new Error(msg || 'assertion failed');
    }
  },
  'raise': function (msg) {
    throw new Error(msg);
  },
  'notImplem': function () {
    _.raise('not implemented');
  },
  'isPromise': function (o) {
    return o instanceof Promise;
  },
  'isEqual': function (a, b) {
    var am = a instanceof moment;
    var bm = b instanceof moment;
    if (am || bm) {
      if (am && bm) {
        return a.isSame(b);
      }
      else {
        return false;
      }
    }
    else {
      return isEqual(a, b);
    }
  },
  'objFilter': function (input, test, context) {
    test = test || _.identity;
    return _.reduce(input, (obj, v, k) => {
      if (test.call(context, v, k, input)) {
        obj[k] = v;
      }
      return obj;
    }, {}, context);
  },
  'decimal': function (n) {
    return new Number(n);
  },
  'date': function (y, M, D) {
    // nil values are replaced by current
    var values = {
      y: y,
      M: M,
      D: D,
      h: 0,
      m: 0,
      s: 0,
      ms: 0
    };
    values = _.objFilter(values, (v) => !(_.isUndefined(v) || v === null));
    var r = moment();
    r.set(values);
    r.isDate = true;
    return r;
  },
  'time': function (h, m, s, ms) {
    // nil values are replaced by current
    var values = {
      y: 0,
      M: 0,
      D: 1,
      h: h,
      m: m,
      s: s,
      ms: ms
    };
    var r = moment();
    r.set(_.objFilter(values, (v) => !(_.isUndefined(v) || v === null)));
    r.isTime = true;
    return r;
  },
  'datetime': function (y, M, D, h, m, s, ms, utc) {
    // nil values are replaced by current
    var values = {
      y: y,
      M: M,
      D: D,
      h: h,
      m: m,
      s: s,
      ms: ms
    };
    var cls = utc && moment.utc || moment;
    var r = cls();
    r.set(_.objFilter(values, (v) => !(_.isUndefined(v) || v === null)));
    r.isDateTime = true;
    return r.local();
  },
  'timedelta': function (y, M, d, h, m, s, ms) {
    var values = {
      y: y,
      M: M,
      d: d,
      h: h,
      m: m,
      s: s,
      ms: ms
    };
    var r = moment.duration(_.objFilter(values, (v) => !(_.isUndefined(v) ||
      v === null)));
    r.isTimeDelta = true;
    return r;
  }
});
