import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const invP='data/ar/invoices.jsonl', payP='data/ar/payments.jsonl';
const inv = fs.existsSync(invP)? fs.readFileSync(invP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const pay = fs.existsSync(payP)? fs.readFileSync(payP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const totalInv = inv.reduce((s,i)=> s + (i.lines||[]).reduce((t,l)=>t + l.qty*l.unit_price - (l.discount||0) + (l.tax||0),0),0);
const totalPay = pay.reduce((s,p)=> s + Number(p.amount||0),0);
const leak = Number((totalInv - totalPay).toFixed(2));
const md = `# AR Leakage ${yyyymm()}\n\n- Invoiced: ${totalInv}\n- Paid: ${totalPay}\n- Leakage: ${leak}\n`;
fs.mkdirSync('ar/reports',{recursive:true}); fs.writeFileSync(`ar/reports/LEAKAGE_${yyyymm()}.md`, md);
console.log('leakage report written');
