import React, { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../api'

function makeApiUrl(path) {
  const base = (API_BASE || '').replace(/\/$/, '')
  if (!base) return path
  return `${base}${path}`
}

function makeWsUrl(path) {
  const base = (API_BASE || '').trim()
  if (!base) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}${path}`
  }
  try {
    const url = new URL(base)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    const rootPath = url.pathname.replace(/\/$/, '')
    url.pathname = `${rootPath}${path}`
    return url.toString()
  } catch {
    const proto = base.startsWith('https') ? 'wss:' : 'ws:'
    const host = base.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `${proto}//${host}${path}`
  }
}

export default function WhisperCard(){
  const fileRef = useRef(null)
  const logRef = useRef(null)
  const wsRef = useRef(null)
  const [log, setLog] = useState('')
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(()=>{
    return ()=>{
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  },[])

  function append(line){
    setLog(prev => (prev ? `${prev}\n${line}` : line))
    requestAnimationFrame(()=>{
      const el = logRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  async function uploadFile(){
    const file = fileRef.current?.files?.[0]
    if (!file){
      append('Pick an audio file.')
      return null
    }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(makeApiUrl('/transcribe/upload'), {
      method: 'POST',
      body: fd
    })
    if (!res.ok){
      append('[error] upload failed')
      return null
    }
    const data = await res.json()
    if (!data?.token){
      append('[error] missing token from upload')
      return null
    }
    return data.token
  }

  function startSocket(path, token){
    return new Promise((resolve, reject)=>{
      const ws = new WebSocket(makeWsUrl(path))
      wsRef.current = ws
      ws.onopen = ()=>{
        ws.send(JSON.stringify({ token, lang: 'en', model: 'base', beam: 5 }))
        resolve(ws)
      }
      ws.onerror = (err)=>{
        append('[error] websocket error')
        wsRef.current = null
        reject(err)
      }
    })
  }

  async function startRun(path){
    try {
      setBusy(true)
      setLog('')
      setSession(null)
      const token = await uploadFile()
      if (!token){
        setBusy(false)
        return
      }
      const ws = await startSocket(path, token)
      ws.onmessage = ev => {
        const line = ev.data
        if (line === '[[BLACKROAD_WHISPER_DONE]]'){
          append('[done]')
          setBusy(false)
          ws.close()
          return
        }
        if (line.startsWith('[[BLACKROAD_SESSION:')){
          const id = line.slice(line.indexOf(':') + 1, line.lastIndexOf(']'))
          setSession(id)
          append(`session=${id}`)
          return
        }
        append(line)
      }
      ws.onclose = ()=>{
        wsRef.current = null
        setBusy(false)
      }
    } catch (err) {
      append(`[error] ${err?.message || err}`)
      setBusy(false)
    }
  }

  async function downloadTranscript(){
    if (!session){
      append('[error] no session to download')
      return
    }
    try {
      const res = await fetch(makeApiUrl(`/transcripts/${encodeURIComponent(session)}`))
      const data = await res.json()
      if (res.status >= 400 || data?.error){
        throw new Error(data?.error || 'not found')
      }
      const blob = new Blob([data.text || ''], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${session}.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      append(`[error] ${err?.message || err}`)
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="font-semibold">Whisper (Streaming)</div>
      <input id="audioFile" ref={fileRef} type="file" accept="audio/*" disabled={busy} />
      <div className="flex items-center gap-2">
        <button id="whisperGo" className="btn" onClick={()=>startRun('/ws/transcribe/run')} disabled={busy}>Transcribe (stream)</button>
        <button id="whisperGoGPU" className="btn" onClick={()=>startRun('/ws/transcribe/run_gpu')} disabled={busy}>Transcribe on Jetson (GPU)</button>
        <button className="btn" onClick={downloadTranscript} disabled={!session}>Save transcript</button>
      </div>
      <pre id="whisperLog" ref={logRef} className="bg-slate-900 text-xs p-3 rounded h-36 overflow-auto whitespace-pre-wrap">{log || '[idle]'}</pre>
      {session && <div className="text-xs text-slate-400">Session: {session}</div>}
    </div>
  )
}

