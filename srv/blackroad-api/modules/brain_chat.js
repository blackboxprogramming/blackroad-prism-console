module.exports = function attachBrainChat({ app }) {
  async function search(q){ const r = await fetch('http://127.0.0.1:4000/api/memory/search',{method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify({q,top_k:5})}); return await r.json(); }
  async function llm(body){ const r = await fetch('http://127.0.0.1:4010/api/llm/chat',{method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}); return await r.json(); }

  app.post('/api/brain/chat', async (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    const body = raw?JSON.parse(raw):{};
    const msgs = body.messages || [];
    const lastUser = [...msgs].reverse().find(m=>m.role==='user')?.content || '';
    const hits = await search(lastUser).catch(()=>({results:[]}));
    const context = hits.results?.map((r,i)=>`[${i+1}] ${r.text}\n(source: ${r.meta?.source||r.id})`).join('\n\n') || '';
    const system = [
      "You are BlackRoad’s local assistant. Use the CONTEXT when helpful; keep answers truthful and concise.",
      "Always ask 1 short follow-up question.",
      context?("CONTEXT:\n"+context):""
    ].filter(Boolean).join('\n\n');

    const out = await llm({
      model: body.model || 'qwen2:1.5b',
      stream: false,
      messages: [
        {role:'system', content: system},
        ...msgs
      ]
    });
    res.json(out);
  });
  console.log('[brain-chat] /api/brain/chat ready');
};
