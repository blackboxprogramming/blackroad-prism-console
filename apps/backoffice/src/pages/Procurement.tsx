import React, { useEffect, useState } from 'react';

export default function Procurement(){
  const [items,setItems]=useState<any[]>([]);
  const [form,setForm]=useState({number:'',vendor:'',amount:0,currency:'USD'});
  const refresh = async ()=> { const j = await (await fetch('/api/admin/procurement/po/recent')).json(); setItems(j.items||[]); };
  const createPO = async ()=> {
    await fetch('/api/admin/procurement/po',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    await refresh();
  };
  const updateStatus = async (n:string)=> {
    const status = prompt('Status (open|approved|ordered|paid|closed)?','approved')||'approved';
    await fetch(`/api/admin/procurement/po/${n}/status`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
    await refresh();
  };
  useEffect(()=>{ refresh(); },[]);
  return <section>
    <h2>Procurement</h2>
    <div>
      <input placeholder="PO Number" value={form.number} onChange={e=>setForm({...form,number:e.target.value})}/>
      <input placeholder="Vendor" value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})} style={{marginLeft:8}}/>
      <input type="number" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})} style={{marginLeft:8}}/>
      <input placeholder="Currency" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} style={{marginLeft:8}}/>
      <button onClick={createPO} style={{marginLeft:8}}>Create PO</button>
      <button onClick={refresh} style={{marginLeft:8}}>Refresh</button>
    </div>
    <table border={1} cellPadding={6} style={{marginTop:12}}>
      <thead><tr><th>Number</th><th>Vendor</th><th>Amount</th><th>Currency</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{items.map((p:any)=><tr key={p.number}><td>{p.number}</td><td>{p.vendor}</td><td>{p.amount}</td><td>{p.currency}</td><td>{p.status}</td><td><button onClick={()=>updateStatus(p.number)}>Update</button></td></tr>)}</tbody>
    </table>
  </section>;
}
