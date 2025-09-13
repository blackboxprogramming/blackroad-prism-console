(async function(){
  const kpi = await (await fetch('/data/kpi/kpi_latest.json')).json().catch(()=>({}));
  const fc  = await (await fetch('/data/finance/forecast.json')).json().catch(()=>({}));
  const k = document.getElementById('kpis');
  k.innerHTML = Object.entries(kpi).map(([n,v])=>`<div><b>${n}</b>: <code>${v}</code></div>`).join('');

  // tiny chart without deps
  const c = document.getElementById('chart').getContext('2d');
  c.clearRect(0,0,700,260);
  c.fillStyle = '#eee'; c.fillRect(0,0,700,260);
  const series = (fc.base||[]).map(x=>x.arr);
  const max = Math.max(1, ...series);
  c.strokeStyle = '#000';
  c.beginPath();
  series.forEach((v,i)=>{
    const x = 20 + i*(660/Math.max(1,series.length-1));
    const y = 240 - (v/max)*220;
    if (i===0) c.moveTo(x,y); else c.lineTo(x,y);
  });
  c.stroke();
})();
