require('should');
var Session = require('..');
var data = require('./.data');
//
describe('Non authenticated actions', () => {
  var session = new Session(data.server, data.database);
  it('gets server version', () => {
    var promise = session.version()
      .then((result) => {
        result.should.be.String()
          .match(/^4\.0\.\d/);
      });
    promise.should.be.Promise();
    return promise;
  });
  it('gets languages', () => {
    var promise = session.listLang()
      .then((result) => {
        result.should.be.Array();
        result.forEach((l) => {
          l.should.be.Array();
          l[0].should.be.String();
          l[1].should.be.String();
        });
      });
    promise.should.be.Promise();
    return promise;
  });
  it('gets databases', () => {
    var promise = session.listDB()
      .then((result) => {
        result.should.be.Array();
        result.forEach((db) => {
          db.should.be.String();
        });
      });
    promise.should.be.Promise();
    return promise;
  });
});
