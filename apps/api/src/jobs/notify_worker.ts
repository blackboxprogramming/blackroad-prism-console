import fetch from 'node-fetch';
(async()=>{
  const [channel,to,message] = process.argv.slice(2);
  await fetch('http://localhost:4000/api/notify/send',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ channel, to, message, subject:'BlackRoad' }) });
  console.log('Notify dispatched');
})().catch(e=>{ console.error(e); process.exit(0); });
