// FILE: /apps/lucidia/api/server.js
import express from 'express';
const app = express();

app.get('/health', (_, res) => res.send('ok'));
app.get('/', (_, res) => res.json({ status: 'lucidia api' }));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API listening on ${port}`));
