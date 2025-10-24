import React from 'react';

export default function DownloadButton({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow hover:bg-slate-100"
    >
      Download
    </a>
  );
}
