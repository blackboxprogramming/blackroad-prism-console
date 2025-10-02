const variants = ['A','B'];
(async ()=>{
  const metrics = { A: { conv: 0.12 }, B: { conv: 0.14 } }; // placeholder
  const lift = (metrics.B.conv - metrics.A.conv) / metrics.A.conv;
  const text = `Experiments: pricing_banner — A=${metrics.A.conv*100}% B=${metrics.B.conv*100}% lift=${(lift*100).toFixed(2)}%`;
  if (process.env.SLACK_WEBHOOK) {
    await fetch(process.env.SLACK_WEBHOOK, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text}) });
  } else { console.log(text); }
})();
