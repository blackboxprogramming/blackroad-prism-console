import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.get('/files/recent',(_req,res)=>{ const dir='data/tax/files'; const files=fs.existsSync(dir)? fs.readdirSync(dir).sort().reverse().slice(0,10):[]; res.json({files}); });
export default r;
