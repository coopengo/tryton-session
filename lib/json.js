var types = require('tryton-types');
var atob = require('atob');
var btoa = require('btoa');

function fromTryton(value, index, parent) {
  if (value instanceof Array) {
    for (var i = 0, length = value.length; i < length; i++) {
      fromTryton(value[i], i, value);
    }
  }
  else if ((typeof (value) !== 'string') && (typeof (value) !== 'number') && (
      value !== null)) {
    if (value && value.__class__) {
      switch (value.__class__) {
      case 'datetime':
        value = types.datetime(value.year, value.month - 1, value.day, value.hour,
          value.minute, value.second, value.microsecond / 1000, true);
        break;
      case 'date':
        value = types.date(value.year, value.month - 1, value.day);
        break;
      case 'time':
        value = types.time(value.hour, value.minute, value.second, value.microsecond /
          1000);
        break;
      case 'timedelta':
        value = types.timedelta({
          s: value.seconds
        });
        break;
      case 'bytes':
        // javascript's atob does not understand linefeed
        // characters
        var byte_string = atob(value.base64.replace(/\s/g, ''));
        // javascript decodes base64 string as a "DOMString", we
        // need to convert it to an array of bytes
        var array_buffer = new ArrayBuffer(byte_string.length);
        var uint_array = new Uint8Array(array_buffer);
        for (var j = 0; j < byte_string.length; j++) {
          uint_array[j] = byte_string.charCodeAt(j);
        }
        value = uint_array;
        break;
      case 'Decimal':
        value = types.decimal(value.decimal);
        break;
      }
      if (parent) {
        parent[index] = value;
      }
    }
    else {
      for (var p in value) {
        fromTryton(value[p], p, value);
      }
    }
  }
  return parent || value;
}

function toTryton(value, index, parent) {
  if (value instanceof Array) {
    for (var i = 0, length = value.length; i < length; i++) {
      toTryton(value[i], i, value);
    }
  }
  else if ((typeof (value) !== 'string') && (typeof (value) !== 'number') && (
      value !== null) && (value !== undefined)) {
    if (types.isDate(value)) {
      value = {
        '__class__': 'date',
        'year': value.year(),
        'month': value.month() + 1,
        'day': value.date()
      };
      if (parent) {
        parent[index] = value;
      }
    }
    else if (types.isDateTime(value)) {
      value = value.clone();
      value = {
        '__class__': 'datetime',
        'year': value.utc()
          .year(),
        'month': value.utc()
          .month() + 1,
        'day': value.utc()
          .date(),
        'hour': value.utc()
          .hour(),
        'minute': value.utc()
          .minute(),
        'second': value.utc()
          .second(),
        'microsecond': value.utc()
          .millisecond() * 1000
      };
      if (parent) {
        parent[index] = value;
      }
    }
    else if (types.isTime(value)) {
      value = {
        '__class__': 'time',
        'hour': value.hour(),
        'minute': value.minute(),
        'second': value.second(),
        'microsecond': value.millisecond() * 1000
      };
      if (parent) {
        parent[index] = value;
      }
    }
    else if (types.isTimeDelta(value)) {
      value = {
        '__class__': 'timedelta',
        'seconds': value.asSeconds()
      };
      if (parent) {
        parent[index] = value;
      }
    }
    else if (types.isDecimal(value)) {
      value = {
        '__class__': 'Decimal',
        'decimal': value.toString()
      };
      if (parent) {
        parent[index] = value;
      }
    }
    else if (value instanceof Uint8Array) {
      value = {
        '__class__': 'bytes',
        'base64': btoa(String.fromCharCode.apply(null, value))
      };
      if (parent) {
        parent[index] = value;
      }
    }
    else {
      for (var p in value) {
        toTryton(value[p], p, value);
      }
    }
  }
  return parent || value;
}
//
// exports
exports.toTryton = toTryton;
exports.fromTryton = fromTryton;
