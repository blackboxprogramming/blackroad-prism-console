/* FILE: /var/www/blackroad/src/server.js */
import express from 'express';
import aiderRouter from './routes/aider.js';

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/aider', aiderRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
