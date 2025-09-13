import { Router } from 'express';
const r = Router();
r.get('/', (_req, res) => res.json({ uptime: process.uptime(), ts: Date.now() }));
export default r;
