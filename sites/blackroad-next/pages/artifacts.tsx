import { useEffect, useMemo, useState } from 'react';
import { hashFileSHA256 } from '@/lib/hash';

type Entry = { hash: string; file: string };

export default function ArtifactsPage(){
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Entry | null>(null);
  const [verifyResult, setVerifyResult] = useState<null | 'ok' | 'mismatch'>(null);

  useEffect(()=>{
    fetch('/api/artifacts/index').then(r=>r.json()).then(d=>{
      setEntries(d.entries || []);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  async function onPickFile(ev: React.ChangeEvent<HTMLInputElement>){
    const file = ev.target.files?.[0];
    if(!file || !sel) return;
    setVerifyResult(null);
    const h = await hashFileSHA256(file);
    setVerifyResult(h === sel.hash ? 'ok' : 'mismatch');
  }

  const groups = useMemo(()=>{
    // group by top-level dir under artifacts/
    const g = new Map<string, Entry[]>();
    for(const e of entries){
      const m = e.file.match(/^artifacts\/(\w+)/);
      const key = m ? m[1] : 'misc';
      g.set(key, [...(g.get(key)||[]), e]);
    }
    return Array.from(g.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  },[entries]);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Build Artifacts</h1>
      {loading && <p>Loading…</p>}
      {!loading && entries.length===0 && <p>No artifacts yet. Run the Phase 37 demo or check CI.</p>}

      {groups.map(([bucket, list]) => (
        <section key={bucket} className="mb-8">
          <h2 className="text-lg font-medium mb-2">{bucket}</h2>
          <div className="overflow-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2">File</th>
                  <th className="text-left p-2">SHA-256</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(e => (
                  <tr key={e.file} className="border-t">
                    <td className="p-2 font-mono text-xs">{e.file}</td>
                    <td className="p-2 font-mono text-xs break-all">{e.hash}</td>
                    <td className="p-2 flex gap-2 justify-center">
                      <button
                        className="rounded-2xl border px-3 py-1"
                        onClick={()=>{ navigator.clipboard.writeText(e.hash); }}
                      >Copy hash</button>
                      <a
                        className="rounded-2xl border px-3 py-1"
                        href={'/'+e.file}
                        download
                      >Download</a>
                      <button
                        className="rounded-2xl border px-3 py-1"
                        onClick={()=>{ setSel(e); setVerifyResult(null); (document.getElementById('filepick') as HTMLInputElement)?.click(); }}
                      >Verify…</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <input id="filepick" type="file" className="hidden" onChange={onPickFile} />

      {sel && (
        <div className="mt-4 rounded-2xl border p-4">
          <div className="mb-2">Verify against <span className="font-mono text-xs">{sel.file}</span></div>
          {verifyResult === 'ok' && <div className="text-green-600">Hash match ✔</div>}
          {verifyResult === 'mismatch' && <div className="text-red-600">Hash mismatch ✖</div>}
          {!verifyResult && <div className="opacity-70">Choose a file to verify.</div>}
        </div>
      )}
    </main>
  );
}
