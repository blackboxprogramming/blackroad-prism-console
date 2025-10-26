// GitHub webhook -> LED & progress. Verify signature if GITHUB_WEBHOOK_SECRET set.
// Map push/success/failure to LED patterns; optional deploy progress passthrough.
const crypto = require('crypto');
const COLLAB_URL = process.env.COLLAB_BUS_URL || "http://127.0.0.1:9000";

async function postCollabEvent(event, payload) {
  try {
    await fetch(`${COLLAB_URL.replace(/\/$/, '')}/collab/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload })
    });
  } catch (err) {
    console.warn('[collab-bus] broadcast failed', err);
  }
}

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
      const subject = body.pull_request
        ? `pr-${body.pull_request.number}`
        : body.issue
        ? `issue-${body.issue.number}`
        : body.workflow_run
        ? `workflow-${body.workflow_run.id}`
        : body.deployment
        ? `deployment-${body.deployment.id}`
        : event;
      const collabPayload = {
        agent: body.sender?.login || 'github-bot',
        ts: Date.now() / 1000,
        subject,
        metadata: {
          event,
          repository: body.repository?.full_name,
          action: body.action,
          ref: body.ref || body.pull_request?.head?.ref,
          status: body.workflow_run?.conclusion || body.deployment_status?.state || body.review?.state,
          type: body.pull_request ? 'pull_request' : body.issue ? 'issue' : 'event'
        }
      };
      if (event === 'pull_request_review') {
        collabPayload.decision = body.review?.state;
        await postCollabEvent('decision', collabPayload);
      } else if (['push', 'pull_request', 'issues', 'issue_comment', 'pull_request_review_comment'].includes(event)) {
        await postCollabEvent('presence', collabPayload);
      } else if (['workflow_run', 'deployment_status'].includes(event)) {
        await postCollabEvent('focus', collabPayload);
      }
      ok(res,{ok:true});
    });
  });
  console.log("[github] webhook attached");
};
