import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'
import { Routes, Route, Link } from 'react-router-dom'
import { API_BASE, setToken, login, me, fetchTimeline, fetchTasks, fetchCommits, fetchAgents, fetchWallet, fetchContradictions, getNotes, setNotes, action } from './api'
import { Brain, Database, LayoutGrid, Rocket, Settings, ShieldCheck, SquareDashedMousePointer, Wallet } from 'lucide-react'
import Timeline from './components/Timeline.jsx'
import Tasks from './components/Tasks.jsx'
import Commits from './components/Commits.jsx'
import AgentStack from './components/AgentStack.jsx'
import Login from './components/Login.jsx'
import RoadChain from './components/RoadChain.jsx'

export default function App(){
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('timeline')
  const [timeline, setTimeline] = useState([])
  const [tasks, setTasks] = useState([])
  const [commits, setCommits] = useState([])
  const [agents, setAgents] = useState([])
  const [wallet, setWallet] = useState({ rc: 0 })
  const [contradictions, setContradictions] = useState({ issues: 0 })
  const [system, setSystem] = useState({ cpu: 0, mem: 0, gpu: 0 })
  const [notes, setNotesState] = useState('')
  const [socket, setSocket] = useState(null)
  const [stream, setStream] = useState(true)

  function resetState(){
    setUser(null)
    setTimeline([])
    setTasks([])
    setCommits([])
    setAgents([])
    setWallet({ rc: 0 })
    setContradictions({ issues: 0 })
    setNotesState('')
    if(socket){
      socket.disconnect()
      setSocket(null)
    }
  }

  // Bootstrap authentication token from local storage
  useEffect(()=>{
    const token = localStorage.getItem('token')
    if (token) setToken(token)
    (async ()=>{
      try {
        if (token) {
          const u = await me()
          setUser(u)
          await bootData()
          connectSocket()
        }
      } catch(e){
        // Clear invalid token, reset state, and log the failure
        localStorage.removeItem('token')
        setToken('')
        resetState()
        console.error('User not authenticated:', e)
      }
    })()
  }, [])

  async function bootData(){
    const [tl, ts, cs, ag, w, c, n] = await Promise.all([
      fetchTimeline(), fetchTasks(), fetchCommits(), fetchAgents(), fetchWallet(), fetchContradictions(), getNotes()
    ])
    setTimeline(tl); setTasks(ts); setCommits(cs); setAgents(ag); setWallet(w); setContradictions(c); setNotesState(n || '')
  }

  function connectSocket(){
    const s = io(API_BASE, { transports: ['websocket'] })
    s.on('system:update', d => stream && setSystem(d))
    s.on('timeline:new', d => setTimeline(prev => [d.item, ...prev]))
    s.on('wallet:update', w => setWallet(w))
    s.on('notes:update', n => setNotesState(n || ''))
    setSocket(s)
  }

  async function handleLogin(usr, pass){
    const { token, user } = await login(usr, pass)
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
    await bootData()
    connectSocket()
  }

  async function onAction(name){
    await action(name)
  }

  return (
    <div className="min-h-screen flex">
      {!user && <Login onLogin={handleLogin} />}
      {user && (
        <>
          {/* Sidebar */}
          <aside className="w-64 p-4 space-y-6 border-r border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2 text-xl font-semibold">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-500" />
              BlackRoad.io
            </div>

            <nav className="space-y-1">
              <NavItem icon={<LayoutGrid size={18} />} text="Workspace" />
              <NavItem icon={<SquareDashedMousePointer size={18} />} text="Projects" />
              <NavItem icon={<Brain size={18} />} text="Agents" />
              <NavItem icon={<Database size={18} />} text="Datasets" />
              <NavItem icon={<ShieldCheck size={18} />} text="Models" />
              <NavItem icon={<Settings size={18} />} text="Integrations" />
              <NavItem icon={<Rocket size={18} />} text="RoadChain" to="/roadchain" />
            </nav>

            <button className="btn w-full text-white font-semibold">Start Co‑Coding</button>

            <div className="pt-8">
              <div className="uppercase text-[11px] text-slate-400 tracking-widest mb-2">Workspace</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><span>Projects</span><span className="badge">12</span></div>
                <div>Agents</div>
                <div>Sessions</div>
                <div>Datasets</div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 px-6 py-4 grid grid-cols-12 gap-6">
            <section className="col-span-8">
              <Routes>
                <Route path="/roadchain" element={<RoadChain />} />
                <Route
                  path="/"
                  element={
                    <>
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
                    </>
                  }
                />
              </Routes>
            </section>

            {/* Right bar */}
            <section className="col-span-4 flex flex-col gap-4">
              <AgentStack stream={stream} setStream={setStream} system={system} wallet={wallet} contradictions={contradictions} notes={notes} setNotes={async (v)=>{ setNotesState(v); await setNotes(v); }} />
            </section>
          </main>
        </>
      )}
    </div>
  )
}

function NavItem({ icon, text, to }){
  const className = "flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-900 cursor-pointer";
  if (to) {
    return (
      <Link to={to} className={className}>
        {icon}<span>{text}</span>
      </Link>
    )
  }
  return (
    <div className={className}>
      {icon}<span>{text}</span>
    </div>
  )
}

function Tab({ children, active, onClick }){
  return (
    <button onClick={onClick} className={`py-3 border-b-2 ${active?'border-indigo-500 text-white':'border-transparent text-slate-400 hover:text-slate-200'}`}>
      {children}
    </button>
  )
}
