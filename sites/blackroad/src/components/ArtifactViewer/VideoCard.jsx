import React from 'react';

export default function VideoCard({ artifact }) {
  if (!artifact?.url) {
    return <div className="text-sm text-slate-500">Video unavailable.</div>;
  }
  return (
    <div className="flex flex-col gap-3">
      <video controls className="max-h-[480px] w-full rounded border border-slate-200 shadow">
        <source src={artifact.url} type="video/webm" />
        Your browser does not support the WebM format.
      </video>
      {artifact.caption ? <p className="text-xs text-slate-500">{artifact.caption}</p> : null}
    </div>
  );
}
