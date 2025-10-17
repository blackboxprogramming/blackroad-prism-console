import { HelpCircle, Link2, Tag, X } from 'lucide-react'
import QuizCard from './QuizCard.jsx'

const typeMeta = {
  quiz: { icon: HelpCircle, label: 'Quiz' },
  note: { icon: Tag, label: 'Key Insight' },
  link: { icon: Link2, label: 'Source' }
}

export default function HotspotCard({ hotspot, onDismiss, onSaveForLater, onComplete }) {
  if (!hotspot) return null

  const meta = typeMeta[hotspot.type] ?? typeMeta.note
  const Icon = meta.icon

  return (
    <div className="w-96 max-w-full rounded-2xl border border-slate-800 bg-slate-950/90 shadow-xl backdrop-blur">
      <header className="flex items-start gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/60 text-slate-200">
          <Icon size={20} />
        </span>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-slate-400">{meta.label}</p>
          <h3 className="text-base font-semibold text-slate-50">
            {hotspot.payload?.title || `Moment ${formatTimestamp(hotspot.start)}–${formatTimestamp(hotspot.end)}`}
          </h3>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          onClick={onDismiss}
          aria-label="Dismiss hotspot"
        >
          <X size={16} />
        </button>
      </header>

      <div className="border-t border-slate-800" />

      <section className="space-y-4 p-4 text-sm text-slate-200">
        {hotspot.type === 'quiz' ? (
          <QuizCard quiz={hotspot.payload?.quiz ?? hotspot.payload} onComplete={onComplete} />
        ) : (
          <>
            {hotspot.payload?.summary && (
              <p className="text-slate-300">{hotspot.payload.summary}</p>
            )}
            {Array.isArray(hotspot.payload?.keyTerms) && hotspot.payload.keyTerms.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Key terms</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {hotspot.payload.keyTerms.map(term => (
                    <span
                      key={term}
                      className="rounded-full bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-200"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {hotspot.payload?.link && (
              <a
                href={hotspot.payload.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:text-sky-200"
              >
                <Link2 size={14} />
                Open reference
              </a>
            )}
          </>
        )}
      </section>

      <footer className="flex items-center justify-between gap-3 border-t border-slate-800 p-4">
        <button
          type="button"
          className="text-xs font-medium text-slate-400 hover:text-slate-200"
          onClick={onSaveForLater}
        >
          Save for later
        </button>
        <button
          type="button"
          className="rounded-lg bg-sky-500/90 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-sky-400"
          onClick={onComplete}
        >
          Mark complete
        </button>
      </footer>
    </div>
  )
}

function formatTimestamp(seconds = 0) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
