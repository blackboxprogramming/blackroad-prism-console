import React, { useEffect, useState } from 'react';
import ArtifactViewer from '../../components/ArtifactViewer/index.jsx';
import ChatPanel from '../../components/ChatPanel/index.jsx';

async function fetchJobs(signal) {
  const response = await fetch('/api/jobs/live', { signal });
  if (!response.ok) {
    throw new Error(`Failed to load jobs (${response.status})`);
  }
  return response.json();
}

export default function LiveJobs() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(controller.signal)
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        if (data.length) {
          setSelectedJobId((current) => current ?? data[0].id);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      });
    return () => controller.abort();
  }, []);

  const activeJob = jobs.find((job) => job.id === selectedJobId) ?? null;

  return (
    <div className="grid h-full grid-cols-[320px_1fr_380px] gap-6 p-6">
      <section className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-base font-semibold text-slate-900">Live Jobs</h1>
          <p className="text-xs text-slate-500">Caption, Simulation, OT, and SB workloads</p>
        </header>
        {error ? (
          <p className="p-4 text-sm text-red-600">{error.message}</p>
        ) : (
          <ul className="flex-1 overflow-auto text-sm">
            {jobs.map((job) => (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left hover:bg-slate-100 ${
                    job.id === selectedJobId ? 'bg-slate-200' : ''
                  }`}
                >
                  <span className="font-semibold text-slate-800">{job.name ?? job.id}</span>
                  <span className="text-xs text-slate-500">{job.status ?? 'unknown status'}</span>
                </button>
              </li>
            ))}
            {!jobs.length ? <li className="p-4 text-sm text-slate-500">No live jobs.</li> : null}
          </ul>
        )}
      </section>

      <ArtifactViewer jobId={activeJob?.id} />
      <ChatPanel jobId={activeJob?.id} protocol="graphql" permissions={{ canPost: activeJob?.canPost !== false }} />
    </div>
  );
}
