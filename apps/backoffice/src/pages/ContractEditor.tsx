import React, { useState } from 'react';

export default function ContractEditor(){
  const [template,setTemplate]=useState('NDA');
  const [vars,setVars]=useState<any>({effective_date:new Date().toISOString().slice(0,10)});
  const [content,setContent]=useState('');
  const renderTpl=async()=>{
    const j=await (await fetch('/api/clm/templates/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template,variables:vars})})).json();
    setContent(j.content||'');
  };
  const create=async()=>{
    const title=prompt('Title?')||`${template} with ${vars.customer_name||vars.party_b_name||'Counterparty'}`;
    await fetch('/api/clm/contracts/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,type:template,party:vars.customer_name||vars.party_b_name||'',amount:0,renewalDate:''})});
    alert('Draft created');
  };
  return <section><h2>Contract Editor</h2>
    <div>
      <select value={template} onChange={e=>setTemplate(e.target.value)}>
        <option>NDA</option><option>MSA</option><option>SOW</option><option>DPA</option>
      </select>
      <button onClick={renderTpl} style={{marginLeft:8}}>Render</button>
      <button onClick={create} style={{marginLeft:8}}>Create Draft</button>
    </div>
    <textarea style={{width:'100%',height:300,marginTop:8}} value={content} onChange={e=>setContent(e.target.value)} />
  </section>;
}
