import React, { useEffect, useState } from 'react';

export default function ProductFeedback(){
  const [items,setItems]=useState<any[]>([]); const [rating,setRating]=useState(5); const [comment,setComment]=useState('');
  const [ideaId,setIdeaId]=useState('');
  const send=async()=>{ await fetch('/api/product/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ideaId,rating,comment,user:'me'})}); setComment(''); alert('Thanks!'); };
  const load=async()=>{ /* optional: wire up a list if stored elsewhere */ };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Product Feedback</h2>
    <div><input placeholder="idea id (optional)" value={ideaId} onChange={e=>setIdeaId(e.target.value)}/><input type="number" value={rating} onChange={e=>setRating(Number(e.target.value))} style={{marginLeft:8,width:60}}/><input placeholder="comment" value={comment} onChange={e=>setComment(e.target.value)} style={{marginLeft:8,width:400}}/><button onClick={send} style={{marginLeft:8}}>Send</button></div>
  </section>;
}
