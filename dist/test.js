test = function (url, database, username, password, models) {
  var s = new Session(url, database);
  return Promise.all(_.map(models, (model) => {
    s.start(username, password)
      .then(() => {
        s.rpc('model.' + model + '.search', [[]])
          .then((l) => {
            return Promise.all(_.map(l, (id) => {
              return s.rpc('model.' + model + '.read', [[id]]);
            }));
          });
      });
  }));
};
