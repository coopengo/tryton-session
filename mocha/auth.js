var _ = require('underscore');
require('should');
var Session = require('..');
var data = require('./.data');
//
describe('Authenticated actions', () => {
  var session = new Session(data.server, data.database);
  before('Starts session', () => {
    return session.start(data.username, data.password);
  });
  it('Lists modules', () => {
    var promise = session.rpc('model.ir.module.search_read', [
        [], 0, null, null, ['name']
      ])
      .then((result) => {
        result.should.be.Array();
        result.forEach((obj) => {
          obj.should.be.Object();
          obj.should.have.property('id')
            .which.is.a.Number();
          obj.should.have.property('name')
            .which.is.a.String();
        });
        var ir_module = _.filter(result, (obj) => {
          return obj.name === 'ir';
        });
        ir_module.should.be.Array();
        _.size(ir_module)
          .should.equal(1);
        var res_module = _.filter(result, (obj) => {
          return obj.name === 'res';
        });
        res_module.should.be.Array();
        _.size(res_module)
          .should.equal(1);
      });
    promise.should.be.Promise();
    return promise;
  });
  after('Stops session', () => {
    return session.stop();
  });
});
