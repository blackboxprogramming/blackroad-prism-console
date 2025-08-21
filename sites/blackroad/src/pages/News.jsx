import { useEffect, useState } from 'react';

function useJson(url, fallback){
  const [d,setD]=useState(fallback);
  useEffect(()=>{ fetch(url,{cache:'no-cache'}).then(r=>r.json()).then(setD).catch(()=>setD(fallback)) },[url]);
  return d;
}

export default function News(){
  const data = useJson('/news.json', { news: [] });
  const preview = new window.URLSearchParams(window.location.search).has('preview');
  const items = (data.news||[]).filter(n=>preview || n.published);
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">News</h2>
      {items.length ? (
        <ul className="space-y-3">
          {items.map(n=>(
            <li key={n.id} className="p-3 rounded bg-white/5 border border-white/10">
              <h3 className="font-semibold">{n.title}</h3>
              <p className="text-sm mt-1">{n.body}</p>
              {!n.published && <span className="text-xs opacity-60">draft</span>}
            </li>
          ))}
        </ul>
      ) : <p>No news items found.</p>}
    </div>
  );
}
