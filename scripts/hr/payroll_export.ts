import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const ORG='data/hr/org.json'; const PTO='data/hr/pto_requests.jsonl';
const people = fs.existsSync(ORG)? JSON.parse(fs.readFileSync(ORG,'utf-8')) : [];
const pto = fs.existsSync(PTO)? fs.readFileSync(PTO,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)) : [];
const month = yyyymm();
const hoursByEmp: Record<string, number> = {};
for(const r of pto){ const m=new Date(r.start).toISOString().slice(0,7).replace('-',''); if(m===month && r.status==='approved'){ const days=(Date.parse(r.end)-Date.parse(r.start))/86400000+1; hoursByEmp[r.employeeId]=(hoursByEmp[r.employeeId]||0)+days*8; } }
const out = '/tmp/payroll_'+month+'.csv';
fs.writeFileSync(out, 'email,name,title,pto_hours_month,currency\n' + people.map((p:any)=>[p.email,p.name,p.title||'',hoursByEmp[p.id||p.email]||0,process.env.PAYROLL_BASE_CURRENCY||'USD'].join(',')).join('\n'));
console.log('wrote', out);
