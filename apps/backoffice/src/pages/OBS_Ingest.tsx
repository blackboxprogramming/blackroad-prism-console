import React from 'react';

export default function OBS_Ingest(){
  const metrics=async()=>{ const body={service:'api',points:[{name:'availability',value:0.999},{name:'latency_p95',value:220}]}; await fetch('/api/obs/ingest/metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const logs=async()=>{ const body={service:'api',entries:[{ts:new Date().toISOString(),level:'error',msg:'failed request',context:{path:'/v1'}}]}; await fetch('/api/obs/ingest/logs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const traces=async()=>{ const body={service:'api',spans:[{traceId:'t1',spanId:'s1',name:'GET /v1',start:Date.now()-50,end:Date.now(),status:'OK',attrs:{}}]}; await fetch('/api/obs/ingest/trace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  return <section><h2>Ingest (Metrics/Logs/Traces)</h2>
    <div><button onClick={metrics}>Send Metrics</button><button onClick={logs} style={{marginLeft:8}}>Send Logs</button><button onClick={traces} style={{marginLeft:8}}>Send Trace</button></div>
  </section>;
}
