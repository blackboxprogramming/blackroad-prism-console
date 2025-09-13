import fs from 'fs';
import yaml from 'yaml';

type Assump = { start_arr:number; new_mrr:number; gross_churn_rate:number; expansion_rate:number };
function proj(a:Assump, months:number){
  const rows: any[] = [];
  let arr = a.start_arr;
  for (let m=1; m<=months; m++){
    const churn = arr * a.gross_churn_rate;
    const expand = arr * a.expansion_rate;
    arr = arr - churn + expand + a.new_mrr*12/12;
    rows.push({ month: m, arr: Math.round(arr) });
  }
  return rows;
}

const cfg = yaml.parse(fs.readFileSync('finance/model/assumptions.yaml','utf-8'));
const months = Number(cfg.months||12);
const base = proj(cfg.assumptions.base, months);
const bull = proj({ ...cfg.assumptions.base, ...cfg.assumptions.bull }, months);
const bear = proj({ ...cfg.assumptions.base, ...cfg.assumptions.bear }, months);

fs.mkdirSync('data/finance', { recursive: true });
fs.writeFileSync('data/finance/forecast.json', JSON.stringify({ start_month: cfg.start_month, months, base, bull, bear }, null, 2));
console.log('Forecast ready');
