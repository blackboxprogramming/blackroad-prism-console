import fs from 'fs';
const man = 'support/kb/manifest.json';
const pubDir = 'public/help';
fs.mkdirSync(pubDir, { recursive:true });
const m = fs.existsSync(man)? JSON.parse(fs.readFileSync(man,'utf-8')) : { articles:[] };
for(const a of m.articles||[]){
  const md = fs.readFileSync(`support/kb/articles/${a.slug}.md`,'utf-8');
  const html = `<html><head><meta charset="utf-8"><title>${a.title}</title></head><body><pre>${md.replace(/[<&>]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre></body></html>`;
  fs.writeFileSync(`${pubDir}/${a.slug}.html`, html);
}
console.log('KB built to', pubDir);
