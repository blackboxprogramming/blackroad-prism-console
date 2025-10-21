'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((response) => response.json());

const cellColor = (color: string) =>
  color === 'green'
    ? 'bg-green-50 border-green-200'
    : color === 'yellow'
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200';

type RiskSystem = {
  key: string;
  name: string;
  risk: number;
  color: string;
  burn: number;
  findings: number;
  cost: number;
  action: string;
};

type RiskResponse = {
  updated: string;
  systems: RiskSystem[];
};

export default function RiskHeatmap() {
  const { data } = useSWR<RiskResponse>('/api/scorecard/risk', fetcher, {
    refreshInterval: 60_000,
  });

  if (!data) {
    return <p className="p-6">Loading…</p>;
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Risk Heatmap</h1>
      <div className="grid md:grid-cols-3 gap-3">
        {data.systems.map((system) => (
          <div key={system.key} className={`border rounded-xl p-4 ${cellColor(system.color)}`}>
            <div className="flex justify-between items-baseline">
              <h2 className="font-semibold">{system.name}</h2>
              <span className="text-sm">Risk {system.risk}</span>
            </div>
            <div className="mt-2 text-sm grid grid-cols-3 gap-2">
              <div>
                <div className="font-medium">Burn</div>
                <div>{system.burn}</div>
              </div>
              <div>
                <div className="font-medium">Findings</div>
                <div>{system.findings}</div>
              </div>
              <div>
                <div className="font-medium">Cost</div>
                <div>{system.cost}</div>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="font-medium">Next:</span> {system.action}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4">Updated {new Date(data.updated).toLocaleString()}</p>
    </main>
  );
}
