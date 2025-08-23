/* FILE: /var/www/blackroad/src/server.js */
import express from 'express';
import aiderRouter from './routes/aider.js';
import musicRouter from './routes/music.js';
import roadcoinRouter from './routes/roadcoin.js';

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/aider', aiderRouter);
const MUSIC_DIR = process.env.MUSIC_OUT || '/opt/blackroad/data/outputs';
app.use('/api/music', musicRouter);
app.use('/api/roadcoin', roadcoinRouter);
app.use('/media', express.static(MUSIC_DIR));

const PORT = process.env.PORT || 8000;
app.listen(
  PORT,
  '0.0.0.0',
  () => console.log(`[server] listening on 0.0.0.0:${PORT}`)
);
