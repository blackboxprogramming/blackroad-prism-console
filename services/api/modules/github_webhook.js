// GitHub webhook -> LED & progress. Verify signature if GITHUB_WEBHOOK_SECRET set.
// Map push/success/failure to LED patterns; optional deploy progress passthrough.
const crypto = require('crypto');
module.exports = function attachGitHubHook({ app }) {
  if (!app) throw new Error("github_webhook: need app");
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
  function ok(res,obj){ res.status(200).json(obj||{ok:true}); }
  function sigOk(sig, raw){
    if (!secret) return true;
    const h = 'sha256='+crypto.createHmac('sha256', secret).update(raw).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig||''));
  }
  app.post('/api/github/hook', (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d);
    req.on('end', async ()=>{
      const sig = req.get('X-Hub-Signature-256') || '';
      if (!sigOk(sig, raw)) return res.status(403).json({error:'bad sig'});
      let body={}; try{ body=JSON.parse(raw);}catch{}
      const event = req.get('X-GitHub-Event') || 'unknown';
      // Simple mappings
      let payload=null;
      if (event==='workflow_run'){
        const st=body.workflow_run?.conclusion || body.workflow_run?.status;
        if (st==='success') payload = {type:'led.celebrate', ttl_s:20};
        else if (st==='failure' || st==='cancelled') payload={type:'led.emotion', emotion:'error', ttl_s:20};
        else payload={type:'led.emotion', emotion:'busy', ttl_s:20};
      } else if (event==='push'){
        payload={type:'led.emotion', emotion:'busy', ttl_s:10};
      } else if (event==='deployment_status'){
        const st=body.deployment_status?.state;
        if (st==='in_progress') payload={type:'led.progress', pct:50, ttl_s:120};
        if (st==='success') payload={type:'led.celebrate', ttl_s:20};
        if (st==='failure') payload={type:'led.emotion', emotion:'error', ttl_s:20};
      }
      if (payload){
        try{
          await fetch('http://127.0.0.1:4000/api/devices/pi-01/command',{
            method:'POST',
            headers:{'Content-Type':'application/json','X-BlackRoad-Key':(process.env.ORIGIN_KEY||'')},
            body:JSON.stringify(payload)
          });
        }catch{}
      }
      ok(res,{ok:true});
    });
  });
  console.log("[github] webhook attached");
};
