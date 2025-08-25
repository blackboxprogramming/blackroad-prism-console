// Prism backend server scaffold
const express = require('express');
const jwt = require('jsonwebtoken');
// TODO: import routes
const app = express();
app.use(express.json());

// TODO: JWT middleware placeholder
// app.use((req,res,next)=>{ /* verify token */ next(); });

// TODO: mount routes
app.get('/', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
}

module.exports = app;
