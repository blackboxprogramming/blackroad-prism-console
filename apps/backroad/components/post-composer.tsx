'use client';

import { FormEvent, useMemo, useState } from 'react';
import clsx from 'clsx';
import { delayOptions, useCompose } from '@/hooks/use-compose';
import { SafetyNotice } from '@/components/safety-notice';
import { PreviewMarkdown } from '@/components/preview-markdown';
import { useTelemetry } from '@/hooks/use-telemetry';

interface PostComposerProps {
  threadId?: string;
  roomId?: string;
  mode?: 'standalone' | 'inline';
}

export function PostComposer({ threadId, roomId, mode = 'inline' }: PostComposerProps) {
  const compose = useCompose({ threadId, roomId });
  const [showPreview, setShowPreview] = useState(false);
  const telemetry = useTelemetry();

  const ariaLabel = useMemo(() => {
    if (threadId) return 'Compose a reply';
    if (roomId) return 'Compose a room message';
    return 'Compose a thread';
  }, [threadId, roomId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const post = await compose.submit();
    if (post) {
      telemetry.track('post:queued', {
        threadId,
        roomId,
        delayMs: compose.delayMs,
      });
    }
  }

  return (
    <form
      aria-label={ariaLabel}
      onSubmit={onSubmit}
      className={clsx(
        'space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm',
        mode === 'standalone' ? 'max-w-3xl' : undefined,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Compose</h2>
        <button
          type="button"
          className="rounded-full border border-brand-500/40 px-3 py-1 text-xs font-medium text-brand-100 hover:bg-brand-500/10"
          onClick={() => setShowPreview((prev) => !prev)}
          aria-pressed={showPreview}
        >
          {showPreview ? 'Edit Markdown' : 'Preview'}
        </button>
      </div>
      {showPreview ? (
        <PreviewMarkdown markdown={compose.markdown} />
      ) : (
        <label className="block text-sm text-slate-300" htmlFor="markdown">
          <span className="sr-only">Markdown content</span>
          <textarea
            id="markdown"
            name="markdown"
            required
            aria-required="true"
            value={compose.markdown}
            onChange={(event) => compose.updateMarkdown(event.target.value)}
            rows={8}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-100 shadow-inner focus:border-brand-400 focus:outline-none"
            placeholder="Share a reflection, question, or invitation. Markdown supported."
          />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-300" htmlFor="delay">
          Visible in
          <select
            id="delay"
            name="delay"
            value={compose.delayMs}
            onChange={(event) => compose.updateDelay(Number(event.target.value))}
            className="rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-brand-400 focus:outline-none"
          >
            {delayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-400">Scheduled for {new Date(compose.scheduledAt).toLocaleString()}</p>
      </div>
      <SafetyNotice warnings={compose.warnings} />
      {compose.error && (
        <p role="alert" className="rounded-md border border-red-700/60 bg-red-900/30 p-3 text-xs text-red-200">
          {compose.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!compose.canSubmit}
          className="inline-flex items-center justify-center rounded-full bg-brand-500/20 px-5 py-2 text-sm font-semibold text-brand-100 transition hover:bg-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {compose.isSubmitting ? 'Queuing…' : 'Queue post'}
        </button>
        <button
          type="button"
          onClick={() => compose.reset()}
          className="text-sm text-slate-300 underline-offset-4 hover:underline"
        >
          Clear draft
        </button>
      </div>
    </form>
  );
}
