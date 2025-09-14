import fs from 'fs';
const ANN='portal/announcements.json';
const now=new Date(); const ymd=now.toISOString().slice(0,10).replace(/-/g,'');
let md = `# Daily Digest ${ymd}\n\n`;
if (fs.existsSync(ANN)){
  const o=JSON.parse(fs.readFileSync(ANN,'utf-8')).items||{};
  const todays = Object.values<any>(o).filter(a=>{
    const d=(a.publish_at? new Date(a.publish_at):null); if(!d) return false;
    const ds=d.toISOString().slice(0,10); return ds===now.toISOString().slice(0,10);
  });
  todays.forEach(a=>{ md+=`- ${a.title}\n`; });
}
fs.mkdirSync('portal/reports',{recursive:true});
fs.writeFileSync(`portal/reports/DIGEST_${ymd}.md`, md);
console.log('portal daily digest written');
