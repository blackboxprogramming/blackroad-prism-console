import { Fragment, useMemo } from 'react'
import { MessageCircle, Network } from 'lucide-react'

export default function MindMapPanel({ clusters = [], activeClusterId = null, onSelectComment, onToggleCluster }) {
  const orderedClusters = useMemo(
    () =>
      [...clusters].sort((a, b) => {
        const aCount = a.comments?.length ?? 0
        const bCount = b.comments?.length ?? 0
        if (aCount === bCount) return (a.topic || '').localeCompare(b.topic || '')
        return bCount - aCount
      }),
    [clusters]
  )

  if (orderedClusters.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-300">
        <p>No discussions yet. Encourage learners to drop the first question or insight.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        <Network size={14} />
        Discussion Map
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {orderedClusters.map(cluster => {
          const comments = Array.isArray(cluster.comments) ? cluster.comments : []
          const commentCount = comments.length
          const isActive = cluster.id === activeClusterId
          const collapsed = !isActive && commentCount > 3
          const commentsToShow = collapsed ? comments.slice(0, 3) : comments

          return (
            <article
              key={cluster.id}
              className={[
                'relative overflow-hidden rounded-2xl border p-4 shadow-lg transition',
                isActive
                  ? 'border-sky-500/80 bg-sky-500/5'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'
              ].join(' ')}
            >
              <header className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{cluster.topic || 'Untitled idea'}</h3>
                  <p className="text-xs text-slate-400">{commentCount} notes</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-slate-900/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300"
                  onClick={() => onToggleCluster?.(cluster.id)}
                >
                  {isActive ? 'Collapse' : 'Expand'}
                </button>
              </header>

              <ol className="space-y-2">
                {commentsToShow.map(comment => (
                  <Fragment key={comment.id}>
                    <li>
                      <button
                        type="button"
                        className="w-full rounded-xl border border-transparent bg-slate-900/60 px-3 py-2 text-left text-xs text-slate-200 transition hover:border-slate-600"
                        onClick={() => onSelectComment?.(comment)}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 rounded-full bg-slate-800 p-1 text-slate-400">
                            <MessageCircle size={12} />
                          </span>
                          <div>
                            <p className="font-semibold">{comment.author || 'Learner'}</p>
                            <p className="text-[11px] text-slate-300">{comment.text}</p>
                            {typeof comment.timestamp === 'number' && (
                              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
                                Jump to {formatTimestamp(comment.timestamp)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  </Fragment>
                ))}

                {collapsed && (
                  <li className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    + {commentCount - commentsToShow.length} more in cluster
                  </li>
                )}
              </ol>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function formatTimestamp(seconds = 0) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
