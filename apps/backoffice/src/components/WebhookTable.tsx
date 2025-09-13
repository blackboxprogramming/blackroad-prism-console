import React from 'react';
export default function WebhookTable({rows}:{rows:any[]}){
  return <table border={1} cellPadding={6}><thead><tr><th>Partner</th><th>URL</th><th>Events</th></tr></thead>
  <tbody>{rows.map((r,i)=><tr key={i}><td>{r.partner}</td><td>{r.url}</td><td>{(r.events||[]).join(', ')}</td></tr>)}</tbody></table>;
}
