import React, { useEffect, useMemo, useState } from 'react'
import { fetchPiStatus } from '../api'

const DEFAULT_POLL_MS = 15000

function useBrowserOnline() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}

export default function PiConsole({ pollMs = DEFAULT_POLL_MS }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const browserOnline = useBrowserOnline()

  useEffect(() => {
    let ignore = false
    let timer

    async function load() {
      try {
        const data = await fetchPiStatus()
        if (!ignore) {
          setStatus(data)
          setError(null)
        }
      } catch (err) {
        if (!ignore) {
          setError(err)
        }
      }
    }

    load()
    timer = setInterval(load, pollMs)
    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [pollMs])

  const reachable = useMemo(() => {
    if (!browserOnline) return false
    if (!status) return false
    if (error) return false
    return Boolean(status.reachable)
  }, [browserOnline, status, error])

  const command = status?.command || 'ssh pi@192.168.4.23 -p 22'
  const url = status?.url
  const lastTs = status?.ts ? new Date(status.ts) : null

  function handleOpen() {
    if (!reachable) return
    if (!url) return
    if (typeof window === 'undefined') return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  let helperText = 'Checking connectivity…'
  if (!browserOnline) {
    helperText = 'Browser offline. Use the SSH command below to connect locally.'
  } else if (reachable) {
    helperText = 'Online — the Pi console can be opened in a new tab.'
  } else if (error) {
    helperText = 'Unable to reach the Pi status endpoint. Retrying automatically.'
  } else if (status) {
    helperText = 'Pi appears offline. Ensure the device is powered on or reachable from this network.'
  }

  return (
    <div className="card p-4 space-y-3">
      <div>
        <div className="font-semibold">Pi Console</div>
        <div className="text-xs text-slate-400 mt-1">
          Target: {status ? `${status.host}:${status.port}` : 'Detecting…'}
        </div>
      </div>
      <div className={`text-sm font-semibold ${reachable ? 'text-green-400' : 'text-red-400'}`}>
        {browserOnline ? (reachable ? 'Online' : 'Offline') : 'Offline'}
      </div>
      <div className="text-xs text-slate-400">{helperText}</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          className="btn"
          type="button"
          onClick={handleOpen}
          disabled={!reachable}
          style={{
            backgroundColor: 'var(--accent-2)',
            color: '#000',
            opacity: reachable ? 1 : 0.5,
          }}
        >
          Open Pi Console
        </button>
        <code className="text-xs bg-slate-900 px-3 py-2 rounded select-all">
          {command}
        </code>
      </div>
      <div className="text-xs text-slate-500">
        {lastTs ? `Last checked ${lastTs.toLocaleTimeString()}` : 'Awaiting status…'}
      </div>
    </div>
  )
}

