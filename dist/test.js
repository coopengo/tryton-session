test = function (url, database, username, password, model) {
  var s = new Session(url, database);
  return s.start(username, password)
    .then(() => {
      return s.rpc('model.' + model + '.search', [
          []
        ])
        .then((l) => {
          return Promise.all(_.map(l, (id) => {
            return s.rpc('model.' + model + '.read', [
              [id]
            ]);
          }));
        });
    });
};
