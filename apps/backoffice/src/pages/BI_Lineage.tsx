import React, { useEffect, useState } from 'react';

export default function BI_Lineage(){
  const [graph,setGraph]=useState<any>({nodes:[],edges:[]});
  const load=async()=>{ try{ const j=await (await fetch('/warehouse/lineage/graph.json')).json(); setGraph(j);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Lineage</h2>
    <pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(graph,null,2)}</pre>
  </section>;
}
