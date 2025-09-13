import fetch from 'node-fetch';
const q = process.argv[2] || (()=>{ const d=new Date(); const q=Math.floor(d.getMonth()/3)+1; return `${d.getFullYear()}Q${q}`; })();
fetch('http://localhost:4000/api/admin/access-review/start',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ quarter: q }) })
  .then(r=>r.json()).then(j=>console.log('opened', j.id || 'n/a')).catch(()=>console.log('stub'));
