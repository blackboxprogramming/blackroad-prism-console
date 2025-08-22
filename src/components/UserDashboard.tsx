import React, { useEffect, useState } from 'react';
import { BillingCard, BillingInfo } from './BillingCard';

interface Deployment {
  id: string;
  name: string;
  date: string;
}

export function UserDashboard() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/billing');
        const data = await res.json();
        setBilling(data.billing);
        setDeployments(data.deployments || []);
      } catch (err) {
        console.error('Failed to load billing info', err);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {billing && <BillingCard {...billing} />}
      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Deployments</h3>
        <ul className="space-y-1">
          {deployments.map((d) => (
            <li key={d.id} className="flex justify-between border-b border-[var(--border)] py-1">
              <span>{d.name}</span>
              <span className="text-sm text-gray-500">{d.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
