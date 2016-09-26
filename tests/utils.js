require('..');
require('should');
//
var _ = require('underscore');
var moment = require('moment');

function check(dt, tag, values) {
  _.assert(dt instanceof moment);
  dt.should.have.property(tag, true);
  dt.year()
    .should.equal(values[0] || 0);
  dt.month()
    .should.equal(values[1] || 0);
  dt.date()
    .should.equal(values[2] || 1);
  dt.hour()
    .should.equal(values[3] || 0);
  dt.minute()
    .should.equal(values[4] || 0);
  dt.second()
    .should.equal(values[5] || 0);
  dt.millisecond()
    .should.equal(values[6] || 0);
}
describe('Date and Time Constructors', () => {
  it('checks date constructor', () => {
    var d = _.date(2010, 0, 1);
    check(d, 'isDate', [2010, 0, 1]);
    d.format('YYYY-MM-DD')
      .should.equal('2010-01-01');
    check(_.date(null, 0, 1), 'isDate', [moment()
      .year(), 0, 1
    ]);
  });
  it('checks time constructor', () => {
    check(_.time(9, 30, 50, 373), 'isTime', [null, null, null, 9, 30,
      50, 373
    ]);
    check(_.time(null, 30, 50, 373), 'isTime', [null, null, null,
      moment()
      .hour(), 30,
      50, 373
    ]);
  });
  it('checks datetime constructor', () => {
    check(_.datetime(2016, 4, 23, 17, 51, 56, 999), 'isDateTime', [2016,
      4, 23, 17, 51, 56, 999
    ]);
    var dt = _.datetime();
    var now = moment();
    var diff = now.valueOf() - dt.valueOf();
    diff.should.be.above(-1);
    diff.should.be.below(10);
  });
  it('checks timedelta constructor', () => {
    var now = moment();
    var d1 = _.timedelta(1);
    d1.should.have.property('isTimeDelta', true);
    var ny = now.year();
    now.add(d1);
    (now.year() - ny)
    .should.equal(1);
    var d2 = _.timedelta(null, null, 1);
    d2.should.have.property('isTimeDelta', true);
    var nd = now.dayOfYear();
    now.add(d2);
    (now.dayOfYear() - nd)
    .should.equal(1); // tesk KO on 12/31? => no issue
  });
});
describe('Inherit', () => {
  function Animal() {}
  Animal.prototype.getName = function () {
    return this.name;
  };
  Animal.prototype.getLevel = function () {
    return 0;
  };

  function Dog(name) {
    this.name = name;
  }
  Dog.prototype.getLevel = function () {
    return 1 + this.__.getLevel.call(this);
  };
  _.inherit(Dog, Animal);
  it('checks inherit / instanceof', () => {
    (new Animal() instanceof Animal)
    .should.equal(true);
    (new Dog() instanceof Dog)
    .should.equal(true);
    (new Animal() instanceof Dog)
    .should.equal(false);
    (new Dog() instanceof Animal)
    .should.equal(true);
  });
  it('checks methods inheritence', () => {
    new Dog('A')
      .getName()
      .should.equal('A');
  });
  it('checks super calls', () => {
    new Animal()
      .getLevel()
      .should.equal(0);
    new Dog()
      .getLevel()
      .should.equal(1);
  });
});
describe('Inherit', function () {
  it('checks isEqual override', function () {
    var m1 = moment()
      .startOf('second');
    var m2 = moment()
      .startOf('second');
    _.isEqual(m1, m2)
      .should.equal(true);
    _.isEqual('hello', 'hello')
      .should.equal(true);
    _.isEqual('hello', 'worlds')
      .should.equal(false);
  });
});
