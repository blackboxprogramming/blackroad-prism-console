import fetch from 'node-fetch';

async function main(){
  const url = process.env.CRM_WAREHOUSE_URL!;
  const token = process.env.CRM_WAREHOUSE_TOKEN!;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }});
  const accounts = await res.json(); // expected: [{name, renewalDate, arr, owner}]
  const now = Date.now();
  const soon = accounts.filter((a:any)=>{
    const d = Date.parse(a.renewalDate);
    const days = Math.floor((d - now)/86400000);
    return [90,60,30].some(x => Math.abs(days-x)<=1);
  });
  const lines = soon.map((a:any)=>`- ${a.name} renews ${a.renewalDate} | ARR $${a.arr} | owner ${a.owner}`);
  const text = lines.length ? `Upcoming renewals:\n${lines.join('\n')}` : 'No upcoming renewals in T-90/60/30 window.';
  if(process.env.SLACK_WEBHOOK){
    await fetch(process.env.SLACK_WEBHOOK, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text})});
  } else { console.log(text); }
}
main().catch(e=>{ console.error(e); process.exit(0); });
