import React from 'react';
export default function KeyTable({rows}:{rows:any[]}){
  return <table border={1} cellPadding={6}><thead><tr><th>Owner</th><th>Key</th><th>Created</th><th>Revoked</th></tr></thead>
  <tbody>{rows.map((r,i)=><tr key={i}><td>{r.owner}</td><td>{r.key.slice(0,6)}…</td><td>{new Date(r.created).toISOString()}</td><td>{r.revoked?new Date(r.revoked).toISOString():''}</td></tr>)}</tbody></table>;
}
