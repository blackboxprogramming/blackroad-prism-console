import { useEffect, useMemo, useState } from 'react';
import CaptionPreview from '../../components/CaptionPreview.jsx';

const DEFAULT_BACKEND = 'local';
const DEFAULT_LANG = 'en';

function useCountdown(active, interval) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const timer = setInterval(() => setTick((value) => value + 1), interval);
    return () => clearInterval(timer);
  }, [active, interval]);
  return tick;
}

export default function CaptionPanel({ assetId, sdk }) {
  const [source, setSource] = useState('');
  const [backend, setBackend] = useState(DEFAULT_BACKEND);
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [watch, setWatch] = useState(false);
  const captionSdk = sdk?.captions;
  const tick = useCountdown(Boolean(watch && job && captionSdk), 2500);

  useEffect(() => {
    if (!watch || !captionSdk || !job) {
      return undefined;
    }
    let isMounted = true;
    async function poll() {
      try {
        const next = await captionSdk.status(job.id);
        if (isMounted && next) {
          setJob(next);
          if (next.status === 'COMPLETE' || next.status === 'FAILED') {
            setWatch(false);
          }
        }
      } catch (pollError) {
        if (isMounted) {
          setError(pollError.message);
          setWatch(false);
        }
      }
    }
    poll();
    return () => {
      isMounted = false;
    };
  }, [tick, watch, job, captionSdk]);

  const previewArtifacts = useMemo(() => {
    if (!job || !job.artifacts) {
      return [];
    }
    return job.artifacts.filter((artifact) => artifact.kind === 'srt' || artifact.kind === 'vtt');
  }, [job]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!captionSdk) {
      setError('SDK unavailable — configure captions client first.');
      return;
    }
    try {
      setError(null);
      const nextJob = await captionSdk.create(assetId, source, backend, lang);
      setJob(nextJob);
      setWatch(true);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <div className="caption-panel">
      <h2 className="caption-panel__title">Captions</h2>
      <form className="caption-panel__form" onSubmit={handleSubmit}>
        <label className="caption-panel__label">
          Source file or URL
          <input
            type="text"
            className="caption-panel__input"
            placeholder="https://example.com/video.mp4"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            required
          />
        </label>
        <div className="caption-panel__row">
          <label className="caption-panel__label">
            Backend
            <select value={backend} onChange={(event) => setBackend(event.target.value)} className="caption-panel__input">
              <option value="local">Local (stub)</option>
              <option value="provider">Provider (HTTP)</option>
            </select>
          </label>
          <label className="caption-panel__label">
            Language
            <input
              type="text"
              className="caption-panel__input"
              value={lang}
              onChange={(event) => setLang(event.target.value)}
              maxLength={5}
            />
          </label>
        </div>
        <button type="submit" className="caption-panel__submit">
          Create caption job
        </button>
      </form>
      {error ? <p className="caption-panel__error">{error}</p> : null}
      {job ? (
        <section className="caption-panel__status">
          <h3>Status</h3>
          <p>
            <strong>{job.status}</strong> • Backend {job.backend} • Updated {job.updatedAt}
          </p>
          {job.error ? <p className="caption-panel__error">{job.error}</p> : null}
          <CaptionPreview artifacts={previewArtifacts} />
          <div className="caption-panel__actions">
            {job.artifacts?.map((artifact) => (
              <a key={artifact.url} className="caption-panel__download" href={artifact.url} download>
                Download {artifact.kind.toUpperCase()} ({artifact.bytes} bytes)
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
