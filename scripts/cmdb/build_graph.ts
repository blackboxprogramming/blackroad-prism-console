import fs from 'fs';
const CIS='cmdb/cis.json'; const outDir='cmdb/reports';
const o=fs.existsSync(CIS)? JSON.parse(fs.readFileSync(CIS,'utf-8')):{cis:{}};
const nodes=Object.values(o.cis||{}).map((ci:any)=>({id:ci.ciId,type:ci.type,env:ci.env||'',owner:ci.owner||''}));
const edges:any[]=[]; for(const ci of Object.values(o.cis||{}) as any[]){ for(const r of (ci.rels||[])){ edges.push({from:ci.ciId,to:r.to,type:r.type}); } }
fs.mkdirSync(outDir,{recursive:true}); const ym=new Date().toISOString().slice(0,7).replace('-','');
fs.writeFileSync(`${outDir}/GRAPH_${ym}.json`, JSON.stringify({nodes,edges},null,2));
console.log('cmdb graph written');
