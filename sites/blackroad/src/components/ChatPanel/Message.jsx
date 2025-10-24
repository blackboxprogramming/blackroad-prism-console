import React from 'react';

export default function Message({ message }) {
  const attachments = message.attachments ?? [];
  const reactions = message.reactions ?? {};
  const redactions = message.redactions ?? [];

  return (
    <article className="rounded border border-slate-200 bg-white p-3 shadow-sm">
      <header className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-800">{message.author}</span>
        <span className="text-slate-400">{new Date(message.ts).toLocaleString()}</span>
      </header>
      <p className="whitespace-pre-wrap text-sm text-slate-800">{message.text}</p>
      {attachments.length ? (
        <ul className="mt-3 space-y-2">
          {attachments.map((attachment, index) => (
            <li key={index} className="text-xs">
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 hover:bg-slate-100"
              >
                {attachment.kind.toUpperCase()} · {attachment.url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {Object.keys(reactions).length ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          {Object.entries(reactions).map(([emoji, count]) => (
            <span key={emoji} className="rounded bg-slate-100 px-2 py-1">
              {emoji} {count}
            </span>
          ))}
        </div>
      ) : null}
      {redactions.length ? (
        <p className="mt-3 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
          Redactions applied: {redactions.join(', ')}
        </p>
      ) : null}
    </article>
  );
}
