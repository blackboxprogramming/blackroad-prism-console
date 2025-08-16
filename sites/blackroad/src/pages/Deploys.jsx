import { useEffect, useState } from 'react';

export default function Deploys() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/deploys.json', { cache: 'no-cache' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ history: [] }));
  }, []);
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Deploy History</h2>
      {!data ? (
        <p>Loading…</p>
      ) : data.history?.length ? (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th align="left">When</th>
              <th>Channel</th>
              <th>SHA</th>
            </tr>
          </thead>
          <tbody>
            {data.history.map((d, i) => (
              <tr key={i}>
                <td>{new Date(d.ts).toLocaleString()}</td>
                <td align="center">
                  <span className="px-2 py-0.5 rounded bg-white/10">{d.channel}</span>
                </td>
                <td align="center">
                  <code>{(d.sha || '').slice(0, 7)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No deploys recorded yet.</p>
      )}
      <p className="mt-3 opacity-70 text-xs">
        History file: <code>/deploys.json</code> (last 25)
      </p>
    </div>
  );
}
