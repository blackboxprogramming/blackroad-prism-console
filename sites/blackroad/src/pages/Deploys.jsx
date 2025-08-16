import { useEffect, useState } from 'react';

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
