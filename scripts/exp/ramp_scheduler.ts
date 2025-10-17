import fs from 'fs';
const RP='exp/ramps.json';
if(!fs.existsSync(RP)) process.exit(0);
const ramps=JSON.parse(fs.readFileSync(RP,'utf-8')).ramps||{};
Object.entries<any>(ramps).forEach(([expId,schedule])=>{
  // stub: log upcoming actions; real system would update flag/weights
  console.log('ramp', expId, schedule.length, 'steps');
});
