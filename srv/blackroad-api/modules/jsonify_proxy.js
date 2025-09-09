// Proxies to br_jsond so web clients can POST /api/normalize safely (same-origin).
module.exports = function attachJsonify({ app }) {
  const url = process.env.BR_JSOND_URL || "http://127.0.0.1:4505/normalize";
  app.post('/api/normalize', async (req, res) => {
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    try{
      const r = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:raw});
      res.status(r.status).type('application/json').send(await r.text());
    }catch(e){ res.status(502).json({error:String(e)}) }
  });
  console.log('[jsonify] proxy at /api/normalize ->', url);
};
