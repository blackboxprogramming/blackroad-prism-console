import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Wallet } from 'lucide-react'
import Timeline from '../components/Timeline.jsx'
import Tasks from '../components/Tasks.jsx'
import Commits from '../components/Commits.jsx'
import AgentStack from '../components/AgentStack.jsx'
import WhisperCard from '../components/WhisperCard.jsx'

export default function Dashboard({ tab, setTab, timeline, tasks, commits, onAction, stream, setStream, system, wallet, contradictions, notes, setNotes }){
  return (
    <>
      <section className="col-span-8">
        <header className="flex items-center gap-8 border-b border-slate-800 mb-4">
          <Tab onClick={()=>setTab('timeline')} active={tab==='timeline'}>Timeline</Tab>
          <Tab onClick={()=>setTab('tasks')} active={tab==='tasks'}>Tasks</Tab>
          <Tab onClick={()=>setTab('commits')} active={tab==='commits'}>Commits</Tab>
          <div className="ml-auto flex items-center gap-2 py-3">
            <button className="badge" onClick={()=>onAction('run')}>Run</button>
            <button className="badge" onClick={()=>onAction('revert')}>Revert</button>
            <button className="badge" onClick={()=>onAction('mint')}><Wallet size={14}/> Mint</button>
          </div>
        </header>
        {tab==='timeline' && <Timeline items={timeline} />}
        {tab==='tasks' && <Tasks items={tasks} />}
        {tab==='commits' && <Commits items={commits} />}
      </section>
      <section className="col-span-4 flex flex-col gap-4">
        <MicTranscriptionCard />
        <AgentStack stream={stream} setStream={setStream} system={system} wallet={wallet} contradictions={contradictions} notes={notes} setNotes={setNotes} />
        <WhisperCard />
      </section>
    </>
  )
}

function MicTranscriptionCard(){
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const wsRef = useRef(null)
  const logViewRef = useRef(null)
  const isRecordingRef = useRef(false)
  const [log, setLog] = useState('Ready.')

  const appendLog = useCallback((line) => {
    setLog(prev => prev ? `${prev}\n${line}` : line)
  }, [])

  useEffect(() => {
    if(logViewRef.current){
      logViewRef.current.scrollTop = logViewRef.current.scrollHeight
    }
  }, [log])

  useEffect(() => {
    return () => {
      if(mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording'){
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
      isRecordingRef.current = false
      if(wsRef.current){
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  const processRecording = useCallback(async (chunks) => {
    if(!chunks?.length){
      appendLog('No audio captured.')
      return
    }

    const blob = new Blob(chunks, { type: 'audio/webm' })
    const fd = new FormData()
    fd.append('file', blob, 'mic.webm')
    setLog('Uploading…')

    try {
      const response = await fetch('/transcribe/upload', { method: 'POST', body: fd })
      if(!response.ok){
        throw new Error(`Upload failed (${response.status})`)
      }

      const { token } = await response.json()
      if(!token){
        throw new Error('Upload failed.')
      }

      setLog('Streaming transcription…')
      if(wsRef.current){
        wsRef.current.close()
        wsRef.current = null
      }
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${proto}://${window.location.host}/ws/transcribe/run`)
      wsRef.current = ws

      ws.onopen = () => {
        try {
          ws.send(JSON.stringify({ token, lang: 'en' }))
        } catch (err) {
          appendLog(`WebSocket send failed: ${err?.message || err}`)
        }
      }

      ws.onmessage = (event) => {
        if(event.data === '[[BLACKROAD_WHISPER_DONE]]'){
          appendLog('[done]')
          ws.close()
          return
        }
        appendLog(event.data)
      }

      ws.onerror = () => appendLog('[stream error]')
      ws.onclose = () => {
        wsRef.current = null
      }
    } catch (err) {
      setLog(`Error: ${err?.message || err}`)
    }
  }, [appendLog])

  const startRecording = async () => {
    if(typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia){
      setLog('Microphone capture unsupported in this browser.')
      return
    }

    if(typeof MediaRecorder === 'undefined'){
      setLog('MediaRecorder API unavailable in this browser.')
      return
    }

    if(isRecordingRef.current || (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')){
      appendLog('Already recording…')
      return
    }

    isRecordingRef.current = true
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if(event.data && event.data.size > 0){
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        mediaRecorderRef.current = null
        const recordedChunks = chunksRef.current.slice()
        chunksRef.current = []
        isRecordingRef.current = false
        processRecording(recordedChunks)
      }

      recorder.onerror = (event) => {
        stream.getTracks().forEach(track => track.stop())
        mediaRecorderRef.current = null
        isRecordingRef.current = false
        setLog(`Recorder error: ${event?.error?.message || event?.name || 'Unknown error'}`)
      }

      recorder.start()
      setLog('Recording…')
    } catch (err) {
      isRecordingRef.current = false
      setLog(`Mic access failed: ${err?.message || err}`)
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if(recorder && recorder.state === 'recording'){
      recorder.stop()
      setLog(prev => prev ? `${prev}\nStopped. Processing…` : 'Stopped. Processing…')
    }
  }

  return (
    <div className="card p-4">
      <div className="title text-lg font-semibold mb-3">Live Mic Transcription</div>
      <div className="flex gap-3 mb-3">
        <button id="recBtn" className="btn" onClick={startRecording}>Start Recording</button>
        <button id="stopBtn" className="btn" onClick={stopRecording}>Stop</button>
      </div>
      <pre
        id="micLog"
        ref={logViewRef}
        className="text-xs"
        style={{ background: '#000', color: '#0f0', padding: '1em', height: '220px', overflow: 'auto', borderRadius: '6px' }}
      >
        {log}
      </pre>
    </div>
  )
}

function Tab({ children, active, onClick }){
  return (
    <button onClick={onClick} className={`py-3 border-b-2 ${active?'border-indigo-500 text-white':'border-transparent text-slate-400 hover:text-slate-200'}`}>{children}</button>
  )
}
