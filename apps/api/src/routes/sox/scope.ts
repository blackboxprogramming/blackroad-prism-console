import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='sox/scope.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ years:{} };
const write=(o:any)=>{ fs.mkdirSync('sox',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/scope/upsert',(req,res)=>{
  const { year, processes, key_controls } = req.body||{};
  const o=read(); o.years[year]={ processes: processes||[], key_controls: key_controls||[] }; write(o); res.json({ ok:true });
});
r.get('/scope/:year',(req,res)=>{
  const o=read(); const y=o.years[String(req.params.year)]; if(!y) return res.status(404).json({error:'not_found'}); res.json(y);
});

export default r;
