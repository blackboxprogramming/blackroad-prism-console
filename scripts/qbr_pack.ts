import fs from 'fs';

function qstr(){ const d=new Date(); const q=Math.floor((d.getMonth())/3)+1; return `${d.getFullYear()}Q${q}`; }
const kpi = JSON.parse(fs.readFileSync('data/kpi/kpi_latest.json','utf-8') || '{}');
const fc  = JSON.parse(fs.readFileSync('data/finance/forecast.json','utf-8') || '{}');

const out = `board/QBR_${qstr()}.md`;
const md = `# QBR ${qstr()}

## Product
- DAU: ${kpi.DAU || 0}
- Availability: ${kpi.Availability || 0}

## Growth
- ARR: ${kpi.ARR || 0}
- NDR: ${kpi.NetDollarRetention || 1.0}

## Forecast (base)
- ${JSON.stringify(fc.base?.slice(-3) || [])}
`;
fs.mkdirSync('board', { recursive: true });
fs.writeFileSync(out, md);
console.log('Wrote', out);
