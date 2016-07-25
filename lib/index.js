var _ = require('underscore');
var moment = require('moment');
require('tryton-base')(_, moment);
var Session = require('./session');
require('./triggers');
module.exports = Session;
