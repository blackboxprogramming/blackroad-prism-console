import { useEffect, useState } from 'react';
import FlagsPanel from '../ui/FlagsPanel.jsx';
export default function Docs() {
  const [docs, setDocs] = useState(null);
  useEffect(() => {
    fetch('/docs/index.json')
      .then((r) => r.json())
      .then((d) => setDocs(d.docs))
      .catch(() => setDocs([]));
  }, []);
  return (
    <div className="grid grid-2">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Docs</h2>
        {!docs ? (
          <p>Loading…</p>
        ) : docs.length === 0 ? (
          <p>No docs yet.</p>
        ) : (
          <ul className="list-disc ml-5">
            {docs.map((d) => (
              <li key={d.slug}>
                <a className="underline" href={`/docs/${d.slug}.json`}>
                  {d.title}
                </a>{' '}
                <span className="opacity-60">({d.section})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <FlagsPanel />
    </div>
  );
}
