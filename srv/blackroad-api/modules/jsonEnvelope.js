// JSON envelope & request ID middleware: enforce {ok,data,error} and X-Request-ID
const crypto = require('crypto');

module.exports = function jsonEnvelope(app){
  app.use((req, res, next) => {
    const id = crypto.randomUUID();
    res.setHeader('X-Request-ID', id);
    // helpers
    res.ok = (data=null, code=200) => {
      res.status(code).type('application/json').send(JSON.stringify({ ok: true, data, error: null }));
    };
    res.fail = (msg='error', code=400, data=null) => {
      res.status(code).type('application/json').send(JSON.stringify({ ok: false, data, error: String(msg) }));
    };
    next();
  });
};
