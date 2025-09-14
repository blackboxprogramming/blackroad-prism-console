import React, { useEffect, useState } from 'react';

export default function TRE_FX_Debt(){
  const [rates,setRates]=useState({date:new Date().toISOString().slice(0,10),pairs:{EURUSD:1.08,USDJPY:152.3}});
  const [deal,setDeal]=useState({dealId:'FX-1',buy:'EUR',sell:'USD',rate:1.08,notional:100000,trade_date:new Date().toISOString().slice(0,10),value_date:new Date(Date.now()+2*86400000).toISOString().slice(0,10)});
  const [fac,setFac]=useState({facilityId:'REV-1',type:'revolver',currency:'USD',limit:1000000,rate:'float',margin_bps:250,maturity:'2028-12-31'});
  const [draw,setDraw]=useState({facilityId:'REV-1',drawId:'DR-1',amount:250000,date:new Date().toISOString().slice(0,10)});
  const [fx,setFx]=useState<any>({});
  const [deb,setDeb]=useState<any>(null);
  const saveRates=async()=>{ await fetch('/api/tre/fx/rates/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(rates)}); await recentFX(); };
  const book=async()=>{ await fetch('/api/tre/fx/deals/book',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(deal)}); await recentFX(); };
  const recentFX=async()=>{ const j=await (await fetch('/api/tre/fx/recent')).json(); setFx(j); };
  const saveFac=async()=>{ await fetch('/api/tre/debt/facility/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fac)}); const k=await (await fetch('/api/tre/debt/facility/REV-1')).json(); setDeb(k); };
  const postDraw=async()=>{ await fetch('/api/tre/debt/draw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draw)}); };
  const interest=async()=>{ const j=await (await fetch('/api/tre/debt/interest/calc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:new Date().toISOString().slice(0,7)})})).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{ recentFX(); saveFac(); },[]);
  return <section><h2>FX & Debt</h2>
    <div><button onClick={saveRates}>Save Rates</button><button onClick={book} style={{marginLeft:8}}>Book Deal</button><button onClick={saveFac} style={{marginLeft:8}}>Save Facility</button><button onClick={postDraw} style={{marginLeft:8}}>Post Draw</button><button onClick={interest} style={{marginLeft:8}}>Calc Interest</button></div>
    <textarea value={JSON.stringify(rates,null,2)} onChange={e=>setRates(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(deal,null,2)} onChange={e=>setDeal(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(fac,null,2)} onChange={e=>setFac(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(draw,null,2)} onChange={e=>setDraw(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <h4 style={{marginTop:8}}>Recent FX</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(fx,null,2)}</pre>
    <h4>Facility</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(deb,null,2)}</pre>
  </section>;
}
