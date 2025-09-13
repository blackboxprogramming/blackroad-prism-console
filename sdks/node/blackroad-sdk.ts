export class BlackRoad {
  constructor(private opts:{ baseUrl:string; apiKey:string }){}
  async ping(){ const r = await fetch(`${this.opts.baseUrl}/api/public/ping`); return r.json(); }
  async enqueueWebhook(url:string, event:string, data:any={}){
    const r = await fetch(`${this.opts.baseUrl}/api/partner/enqueue`, { method:'POST', headers:{'Content-Type':'application/json','x-br-key':this.opts.apiKey}, body: JSON.stringify({ url, event, data }) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json();
  }
}
