import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ImageCard from './ImageCard.jsx';
import TableCard from './TableCard.jsx';
import VideoCard from './VideoCard.jsx';
import JsonCard from './JsonCard.jsx';
import DownloadButton from './DownloadButton.jsx';

const CARD_BY_KIND = {
  image: ImageCard,
  table: TableCard,
  video: VideoCard,
  json: JsonCard,
};

const DEFAULT_ARTIFACTS = [];

async function fetchArtifacts(jobId, signal) {
  const response = await fetch(`/api/jobs/${jobId}/artifacts`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load artifacts (${response.status})`);
  }
  return response.json();
}

export default function ArtifactViewer({ jobId, artifacts: initialArtifacts, onSelect }) {
  const [artifacts, setArtifacts] = useState(initialArtifacts ?? DEFAULT_ARTIFACTS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId || initialArtifacts) {
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    fetchArtifacts(jobId, controller.signal)
      .then((data) => {
        setArtifacts(Array.isArray(data) ? data : []);
        setActiveIndex(0);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [jobId, initialArtifacts]);

  useEffect(() => {
    if (initialArtifacts) {
      setArtifacts(initialArtifacts);
      setActiveIndex(0);
    }
  }, [initialArtifacts]);

  useEffect(() => {
    const handler = (event) => {
      if (!artifacts.length) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % artifacts.length);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + artifacts.length) % artifacts.length);
      }
      if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        const artifact = artifacts[activeIndex];
        if (artifact?.downloadUrl) {
          window.open(artifact.downloadUrl, '_blank');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [artifacts, activeIndex]);

  const activeArtifact = artifacts[activeIndex];
  const Card = useMemo(() => (activeArtifact ? CARD_BY_KIND[activeArtifact.kind] ?? JsonCard : null), [activeArtifact]);

  useEffect(() => {
    if (activeArtifact && onSelect) {
      onSelect(activeArtifact, activeIndex);
    }
  }, [activeArtifact, activeIndex, onSelect]);

  const handleSelect = useCallback(
    (index) => {
      setActiveIndex(index);
    },
    [setActiveIndex],
  );

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Artifacts</h2>
          {jobId ? <p className="text-xs text-slate-500">Job {jobId}</p> : <p className="text-xs text-slate-500">Select a job</p>}
        </div>
        {activeArtifact?.downloadUrl ? <DownloadButton url={activeArtifact.downloadUrl} /> : null}
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-600">{error.message}</div>
      ) : loading ? (
        <div className="p-4 text-sm text-slate-500">Loading artifacts…</div>
      ) : !artifacts.length ? (
        <div className="p-4 text-sm text-slate-500">No artifacts yet.</div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-48 border-r border-slate-200 bg-slate-50">
            <ul className="max-h-full overflow-auto text-sm">
              {artifacts.map((artifact, index) => (
                <li key={artifact.id ?? index}>
                  <button
                    type="button"
                    onClick={() => handleSelect(index)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-100 ${
                      index === activeIndex ? 'bg-slate-200 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span>{artifact.name ?? artifact.kind}</span>
                    <span className="text-xs uppercase text-slate-500">{artifact.kind}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <div className="flex-1 overflow-auto p-4">
            {Card ? <Card artifact={activeArtifact} /> : <div className="text-sm text-slate-500">Unsupported artifact.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
