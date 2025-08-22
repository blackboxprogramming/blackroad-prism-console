import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'
import { Routes, Route, NavLink } from 'react-router-dom'
import { API_BASE, setToken, login, me, fetchTimeline, fetchTasks, fetchCommits, fetchAgents, fetchWallet, fetchContradictions, getNotes, setNotes, action } from './api'
import { Activity, Brain, Database, LayoutGrid, Settings, ShieldCheck, SquareDashedMousePointer } from 'lucide-react'
import Login from './components/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RoadView from './pages/RoadView.jsx'

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
  const [stream, setStream] = useState(true)

  // bootstrap auth from localstorage
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
      } catch(e){ /* not authed */ }
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
              <NavItem to="/" icon={<Activity size={18} />} text="Chat" />
              <NavItem to="/projects" icon={<SquareDashedMousePointer size={18} />} text="Projects" />
              <NavItem to="/agents" icon={<Brain size={18} />} text="Agents" />
              <NavItem to="/datasets" icon={<Database size={18} />} text="Datasets" />
              <NavItem to="/models" icon={<ShieldCheck size={18} />} text="Models" />
              <NavItem to="/integrations" icon={<Settings size={18} />} text="Integrations" />
              <NavItem to="/roadview" icon={<LayoutGrid size={18} />} text="RoadView" />
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 px-6 py-4 grid grid-cols-12 gap-6">
            <Routes>
              <Route path="/" element={<Dashboard tab={tab} setTab={setTab} timeline={timeline} tasks={tasks} commits={commits} onAction={onAction} stream={stream} setStream={setStream} system={system} wallet={wallet} contradictions={contradictions} notes={notes} setNotes={async (v)=>{ setNotesState(v); await setNotes(v); }} />} />
              <Route path="/roadview" element={<RoadView agents={agents} stream={stream} setStream={setStream} system={system} wallet={wallet} contradictions={contradictions} notes={notes} setNotes={async (v)=>{ setNotesState(v); await setNotes(v); }} />} />
            </Routes>
          </main>
        </>
      )}
    </div>
  )
}

function NavItem({ icon, text, to }){
  return (
    <NavLink to={to} className={({isActive})=>`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-900 ${isActive?'text-white':'text-slate-300'}`}>
      {icon}<span>{text}</span>
    </NavLink>
  )
}
