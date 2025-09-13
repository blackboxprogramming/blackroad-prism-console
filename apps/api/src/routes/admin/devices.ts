import { Router } from 'express';
import fs from 'fs';

const r = Router();
const file = 'data/admin/devices.json';
const read = () => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf-8')) : [];
const write = (arr:any) => { fs.mkdirSync('data/admin',{recursive:true}); fs.writeFileSync(file, JSON.stringify(arr,null,2)); };

r.post('/devices/register', (req,res)=>{
  const { deviceId, owner, platform } = req.body || {};
  if (!deviceId || !owner || !platform) return res.status(400).json({ error:'bad_request' });
  const arr = read().filter((d:any)=>d.deviceId!==deviceId);
  arr.push({ deviceId, owner, platform, encrypted:false, compliant:false, lastSeen: Date.now() });
  write(arr); res.json({ ok:true });
});

r.post('/devices/update', (req,res)=>{
  const { deviceId, key, value } = req.body || {};
  const arr = read().map((d:any)=> d.deviceId===deviceId ? { ...d, [key]: value, lastSeen: Date.now() } : d);
  write(arr); res.json({ ok:true });
});

r.get('/devices/list', (_req,res)=> res.json({ items: read() }));

export default r;
