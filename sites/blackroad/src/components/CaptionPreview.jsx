import { useMemo } from 'react';

function formatArtifact(artifact) {
  return `${artifact.kind.toUpperCase()} · ${artifact.bytes} bytes`;
}

export default function CaptionPreview({ artifacts = [] }) {
  const hasArtifacts = artifacts.length > 0;
  const summary = useMemo(() => artifacts.map(formatArtifact).join(' | '), [artifacts]);

  if (!hasArtifacts) {
    return <p className="caption-preview__empty">No caption artifacts yet.</p>;
  }

  return (
    <div className="caption-preview">
      <p className="caption-preview__summary">{summary}</p>
      <pre className="caption-preview__hint">
        Download an artifact to view cues.
      </pre>
    </div>
  );
}
