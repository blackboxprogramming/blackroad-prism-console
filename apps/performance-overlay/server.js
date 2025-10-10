const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 7777;
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Performance overlay available at http://localhost:${port}`);
});
