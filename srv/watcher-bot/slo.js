const db = require('./db');

function calculateSLO(){
  // placeholder: compute uptime over last 30 days
  const since = Date.now() - 30*24*3600*1000;
  const rows = db.getMetrics('30d'); // using checks table
  const total = rows.length;
  const ok = rows.filter(r=>r.ok).length;
  const uptime = total? (ok/total*100) : 100;
  return { uptime };
}

module.exports = { calculateSLO };
