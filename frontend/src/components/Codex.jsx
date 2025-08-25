import React, { useEffect, useState } from 'react'
import { runCodex, fetchCodexHistory } from '../api'

export default function Codex({ socket }) {
  const [prompt, setPrompt] = useState('')
  const [plan, setPlan] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    (async () => {
      const runs = await fetchCodexHistory()
      setHistory(runs)
    })()
  }, [])

  useEffect(() => {
    if (!socket) return
    const onRun = (run) => setHistory((prev) => [run, ...prev])
    socket.on('codex:run', onRun)
    return () => socket.off('codex:run', onRun)
  }, [socket])

  async function onRunPrompt() {
    if (!prompt.trim()) return
    const data = await runCodex(prompt)
    setPlan(data.plan)
  }

  return (
    <div style={{ '--accent': '#FF4FD8', '--accent-2': '#0096FF', '--accent-3': '#FDBA2D' }} className="flex flex-col gap-4">
      <textarea
        className="input w-full h-40"
        placeholder="Enter structured prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={onRunPrompt}
        className="self-start px-4 py-2 rounded-xl text-white font-semibold"
        style={{ background: 'var(--accent)' }}
      >
        Run Prompt
      </button>
      {plan && (
        <div className="card p-4">
          <h3 className="font-semibold mb-2" style={{ color: 'var(--accent-2)' }}>
            Execution Plan
          </h3>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {plan.map((p, i) => (
              <li key={i}>{p.step}. {p.agent}: {p.action}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="card p-4">
        <h3 className="font-semibold mb-2" style={{ color: 'var(--accent-3)' }}>
          Output Timeline
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {history.map((r) => (
            <div key={r.id} className="border-b border-slate-800 pb-2">
              <div className="text-xs text-slate-400">{r.time}</div>
              <div className="whitespace-pre-wrap">{r.result}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
