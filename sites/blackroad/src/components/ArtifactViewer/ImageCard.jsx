import React from 'react';

export default function ImageCard({ artifact }) {
  if (!artifact?.url) {
    return <div className="text-sm text-slate-500">Image unavailable.</div>;
  }
  return (
    <figure className="flex h-full w-full flex-col items-center justify-center gap-3">
      <img
        src={artifact.url}
        alt={artifact.name ?? 'Job artifact'}
        className="max-h-[480px] max-w-full rounded border border-slate-200 object-contain shadow"
      />
      {artifact.caption ? <figcaption className="text-xs text-slate-500">{artifact.caption}</figcaption> : null}
    </figure>
  );
}
