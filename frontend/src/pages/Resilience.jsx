import React, { useEffect, useState } from 'react'
import { API_BASE, fetchSnapshots, createSnapshot, rollbackSnapshot, fetchSnapshotLogs, fetchRollbackLogs } from '../api'

function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed top-4 right-4 bg-slate-800 text-white px-4 py-2 rounded" role="alert">
      {message}
    </div>
  )
}

export default function Resilience() {
  const [snapshots, setSnapshots] = useState([])
  const [selected, setSelected] = useState('')
  const [rollbackStatus, setRollbackStatus] = useState('')
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('')
  const [toast, setToast] = useState('')

  async function load() {
    const [s, snapLogs, rollLogs] = await Promise.all([
      fetchSnapshots(),
      fetchSnapshotLogs(),
      fetchRollbackLogs()
    ])
    setSnapshots(s)
    setLogs([...snapLogs, ...rollLogs])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate() {
    try {
      await createSnapshot()
      setToast('Snapshot created')
      load()
    } catch (e) {
      setToast('Snapshot failed')
    }
  }

  async function handleRollback() {
    if (!selected) return
    if (!window.confirm('This will overwrite DB and service state.')) return
    setRollbackStatus('pending')
    try {
      await rollbackSnapshot(selected)
      setRollbackStatus('success')
      setToast('Rollback completed')
      load()
    } catch (e) {
      setRollbackStatus('fail')
      setToast('Rollback failed')
    }
  }

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <Toast message={toast} />

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Snapshots</h2>
          <button onClick={handleCreate} className="px-3 py-1 rounded text-white" style={{ background: '#0096FF' }}>
            Create
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr><th className="text-left">Timestamp</th><th className="text-left">Size</th><th className="text-left">Status</th><th></th></tr>
          </thead>
          <tbody>
            {snapshots.map(s => (
              <tr key={s.id} className="border-t border-slate-800">
                <td>{s.timestamp}</td>
                <td>{s.size}</td>
                <td>{s.status}</td>
                <td><a className="text-pink-400" href={`${API_BASE}/api/snapshots/${s.id}/download`}>Download</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Rollback</h2>
        <div className="flex gap-2 items-center">
          <select value={selected} onChange={e => setSelected(e.target.value)} className="border px-2 py-1 flex-1">
            <option value="">Select snapshot</option>
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>{s.timestamp}</option>
            ))}
          </select>
          <button onClick={handleRollback} className="px-3 py-1 rounded text-white" style={{ background: '#FF4FD8' }}>
            Rollback
          </button>
          {rollbackStatus && <span>{rollbackStatus}</span>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Logs</h2>
        <input
          placeholder="Search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border px-2 py-1 mb-2 w-full"
        />
        <table className="w-full text-sm">
          <thead>
            <tr><th className="text-left">Timestamp</th><th className="text-left">Action</th><th className="text-left">User</th><th className="text-left">Result</th><th className="text-left">Notes</th></tr>
          </thead>
          <tbody>
            {filteredLogs.map((l, i) => (
              <tr key={i} className="border-t border-slate-800">
                <td>{l.timestamp}</td>
                <td>{l.action}</td>
                <td>{l.user}</td>
                <td>{l.result}</td>
                <td>{l.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
