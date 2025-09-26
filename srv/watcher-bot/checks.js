const db = require('./db');
const alerts = require('./alerts');
const util = require('./util');

const PORTS = [80,443,4000,8000,5173];
const DISKS = ['/', '/var', '/srv'];

async function runChecks(){
  const results=[];

  // HTTP root
  const root = await util.get('http://127.0.0.1/');
  results.push({component:'web', ok:root.status===200, latency_ms:root.ttfb, message:`${root.status}`});

  // API health
  const api = await util.get(process.env.API_HEALTH_URL||'http://127.0.0.1:4000/api/health');
  results.push({component:'api', ok:api.status===200, latency_ms:api.ttfb, message:`${api.status}`});

  // LLM health
  const llmUrl = process.env.LLM_HEALTH_URL;
  if(llmUrl){
    const llm = await util.get(llmUrl);
    results.push({component:'llm', ok:llm.status===200, latency_ms:llm.ttfb, message:`${llm.status}`});
  }

  // SSL
  const sslDays = await util.checkSSL(process.env.TARGET_DOMAIN||'localhost');
  results.push({component:'ssl', ok:sslDays!=null && sslDays>14, message:`${sslDays}d`});

  // Disk usage
  DISKS.forEach(d=>{
    const pct = util.diskUsage(d);
    results.push({component:`disk ${d}`, ok:pct!=null && pct< (process.env.DISK_CRIT_PCT||90), message:`${pct||0}%`});
  });

  // CPU & RAM
  results.push({component:'cpu', ok:true, message:util.cpuLoad().toFixed(2)});
  results.push({component:'ram', ok:true, message:`${util.memoryUsage()}%`});

  // Ports
  for(const p of PORTS){
    const open = await util.portOpen(p);
    results.push({component:`port ${p}`, ok:open, message:open?'open':'closed'});
  }

  // Nginx errors
  const errs = util.tailErrors('/var/log/nginx/error.log');
  results.push({component:'nginx', ok:errs===0, message:`${errs} errors`});

  // log and manage incidents
  for(const r of results){
    db.logCheck(r);
    if(!r.ok){
      const inc = db.getOpenIncident(r.component);
      if(!inc) alerts.notify(r.component,'major',r.message), db.openIncident(r.component,'major',r.message);
    } else {
      const inc = db.getOpenIncident(r.component);
      if(inc){
        alerts.resolve(r.component,r.message);
        db.closeIncident(inc.id);
      }
    }
  }

  return results;
}

module.exports = { runChecks };
