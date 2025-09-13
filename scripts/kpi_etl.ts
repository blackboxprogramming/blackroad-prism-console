import fs from 'fs';
import fetch from 'node-fetch';
import yaml from 'yaml';

async function promQuery(q:string, base:string){
  const url = `${base}/api/v1/query?query=${encodeURIComponent(q)}`;
  const r = await fetch(url); const j = await r.json(); 
  const v = Number(j.data?.result?.[0]?.value?.[1] || 0);
  return v;
}

async function loadFinanceTotals(url?:string){
  if (!url) return { ARR: 0, NetDollarRetention: 1.0 };
  try{
    const r = await fetch(url); const csv = await r.text();
    // naive CSV parse: header: metric,value
    const rows = Object.fromEntries(csv.trim().split('\n').slice(1).map(l=>{ const [m,v]=l.split(','); return [m, Number(v)]; }));
    return { ARR: Number(rows['ARR']||0), NetDollarRetention: Number(rows['NetDollarRetention']||1.0) };
  }catch{ return { ARR: 0, NetDollarRetention: 1.0 }; }
}

(async ()=>{
  const cat = yaml.parse(fs.readFileSync('kpi/catalog.yaml','utf-8'));
  const out: Record<string, number> = {};
  const prom = process.env.PROM_URL || '';
  const fin = await loadFinanceTotals(process.env.FINANCE_CSV_URL);

  for (const k of cat.kpis as any[]) {
    if (k.source === 'prometheus' && k.query && prom) {
      out[k.name] = await promQuery(k.query, prom);
    } else if (k.source === 'finance') {
      out[k.name] = Number(fin[k.name] || 0);
    } else if (k.source === 'product') {
      out[k.name] = 0; // placeholder
    }
  }

  fs.mkdirSync('data/kpi', { recursive: true });
  fs.writeFileSync('data/kpi/kpi_latest.json', JSON.stringify(out, null, 2));
  console.log('KPI ETL complete', out);
})().catch(e=>{ console.error(e); process.exit(0); });
