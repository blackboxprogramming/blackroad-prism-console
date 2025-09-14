import React from 'react';

export default function CONS_IC(){
  const upload=async()=>{ const period=new Date().toISOString().slice(0,7); const rows=[{seller:'US-CO',buyer:'EU-GMBH',account:'4800',amount:5000,currency:'USD'}]; await fetch('/api/cons/ic/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,rows})}); };
  const eliminate=async()=>{ const period=new Date().toISOString().slice(0,7); const j=await (await fetch('/api/cons/ic/eliminate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(JSON.stringify(j)); };
  const results=async()=>{ const period=new Date().toISOString().slice(0,7); const j=await (await fetch(`/api/cons/ic/results?period=${period}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Intercompany Eliminations</h2>
    <div><button onClick={upload}>Import IC</button><button onClick={eliminate} style={{marginLeft:8}}>Eliminate</button><button onClick={results} style={{marginLeft:8}}>Results</button></div>
  </section>;
}
