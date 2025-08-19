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
const CHANNEL_URLS = {
  prod: 'https://blackroad.io',
  beta: 'https://blackroad-beta.vercel.app',
  canary: 'https://blackroad-canary.vercel.app',
};

export default function Deploys() {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    fetch('https://api.github.com/repos/blackboxprogramming/blackroad-prism-console/actions/workflows/deploy-blackroad.yml/runs?status=success&per_page=5')
      .then((r) => r.json())
      .then((d) => setRuns(d.workflow_runs || []))
      .catch(() => {});
  }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Recent Deploys</h2>
      <ul className="list-disc pl-4">
        {runs.map((r) => (
          <li key={r.id}>
            {new Date(r.run_started_at).toLocaleString()} – {r.head_sha.slice(0, 7)}
          </li>
        ))}
      </ul>
      <h3 className="text-lg font-semibold mt-6 mb-2">Channels</h3>
      <ul className="list-disc pl-4">
        {Object.entries(CHANNEL_URLS).map(([chan, url]) => (
          <li key={chan}>
            {chan}: <a className="underline" href={url}>{url}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
