import { useEffect, useMemo, useState } from 'react';

const DEFAULT_SERVICE_ID = 'svc-demo';
const ENDPOINT = process.env.NEXT_PUBLIC_CONTROL_PLANE_ENDPOINT ?? 'http://localhost:4100/graphql';

async function requestDashboard(serviceId) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-dev-token': process.env.NEXT_PUBLIC_LOCAL_DEV_TOKEN ?? ''
    },
    body: JSON.stringify({
      query: `
        query ControlPlaneDashboard($serviceId: ID!) {
          service(id: $serviceId) {
            id
            name
            repo
            environments { id name }
          }
          releases(serviceId: $serviceId) {
            id
            envId
            status
            sha
            version
          }
          incidents(serviceId: $serviceId, limit: 5) {
            id
            severity
            startedAt
            status
            link
          }
          auditTail(serviceId: $serviceId, limit: 10) {
            ts
            actor
            action
            subjectId
            metadata
          }
        }
      `,
      variables: { serviceId }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to load dashboard: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }
  return payload.data;
}

export default function ControlPlaneDashboard() {
  const [serviceId, setServiceId] = useState(DEFAULT_SERVICE_ID);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await requestDashboard(serviceId);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [serviceId]);

  const releasesByEnv = useMemo(() => {
    if (!data?.releases || !data?.service) return [];
    return data.service.environments.map((env) => {
      const release = data.releases.find((item) => item.envId === env.id);
      return { env, release };
    });
  }, [data]);

  return (
    <div className="max-w-5xl mx-auto py-12">
      <h1 className="text-3xl font-semibold mb-6">Control Plane Dashboard</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700" htmlFor="serviceId">
          Service ID
        </label>
        <input
          id="serviceId"
          type="text"
          value={serviceId}
          onChange={(event) => setServiceId(event.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {loading && <p className="text-gray-500">Loading control plane data…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data?.service && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-2">Service Overview</h2>
            <p className="text-sm text-gray-600">{data.service.repo}</p>
            <table className="mt-4 w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2">Environment</th>
                  <th className="border-b p-2">Release</th>
                  <th className="border-b p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {releasesByEnv.map(({ env, release }) => (
                  <tr key={env.id}>
                    <td className="border-b p-2">{env.name}</td>
                    <td className="border-b p-2">{release?.version ?? release?.sha ?? '—'}</td>
                    <td className="border-b p-2">{release?.status ?? 'No release'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Recent Incidents</h2>
            {data.incidents.length === 0 ? (
              <p className="text-sm text-gray-600">No recent incidents.</p>
            ) : (
              <ul className="space-y-2">
                {data.incidents.map((incident) => (
                  <li key={incident.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{incident.id}</span>
                      <span className="text-sm uppercase text-red-600">{incident.severity}</span>
                    </div>
                    <p className="text-sm text-gray-600">{incident.status}</p>
                    <p className="text-xs text-gray-500">Started: {incident.startedAt}</p>
                    {incident.link && (
                      <a className="text-xs text-indigo-600" href={incident.link} target="_blank" rel="noreferrer">
                        View incident
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Audit Stream</h2>
            {data.auditTail.length === 0 ? (
              <p className="text-sm text-gray-600">No audit events recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.auditTail.map((event) => (
                  <li key={`${event.ts}-${event.subjectId}`} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{event.action}</span>
                      <span className="text-xs text-gray-500">{event.ts}</span>
                    </div>
                    <p className="text-sm text-gray-600">{event.actor}</p>
                    <pre className="mt-2 bg-gray-50 p-2 text-xs overflow-x-auto rounded">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
