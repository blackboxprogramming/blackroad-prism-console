import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import { API_BASE, setToken, login, me, fetchTimeline, fetchTasks, fetchCommits, fetchAgents, fetchRoadcoinWallet, fetchContradictions, getNotes, setNotes, action } from './api'
import { API_BASE, setToken, login, me, fetchTimeline, fetchTasks, fetchCommits, fetchAgents, fetchWallet, fetchContradictions, getNotes, setNotes, action } from './api'
import Guardian from './Guardian.jsx'
import { Activity, Brain, Cpu, Database, GitCommit, LayoutGrid, Rocket, Settings, ShieldCheck, SquareDashedMousePointer, Wallet } from 'lucide-react'
import { Activity, Brain, Cpu, Database, GitCommit, LayoutGrid, Rocket, Settings, ShieldCheck, SquareDashedMousePointer, Wallet, User } from 'lucide-react'
import { Activity, Brain, Cpu, Database, GitCommit, LayoutGrid, Rocket, Settings, ShieldCheck, SquareDashedMousePointer, Wallet, BookOpen } from 'lucide-react'
import Timeline from './components/Timeline.jsx'
import Tasks from './components/Tasks.jsx'
import Commits from './components/Commits.jsx'
import AgentStack from './components/AgentStack.jsx'
import Login from './components/Login.jsx'
import RoadCoin from './components/RoadCoin.jsx'
import Dashboard from './components/Dashboard.jsx'
import You from './components/You.jsx'
import Claude from './components/Claude.jsx'
import Codex from './components/Codex.jsx'
import Roadbook from './components/Roadbook.jsx'

export default function App(){
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('timeline')
  const [timeline, setTimeline] = useState([])
  const [tasks, setTasks] = useState([])
  const [commits, setCommits] = useState([])
  const [agents, setAgents] = useState([])
  const [wallet, setWallet] = useState({ rc: 0 })
  const [contradictions, setContradictions] = useState({ issues: 0 })
  const [system, setSystem] = useState({ cpu: 0, mem: 0, gpu: 0, net: 0 })
  const [notes, setNotesState] = useState('')
  const [socket, setSocket] = useState(null)
  const [stream, setStream] = useState(true)
  const path = window.location.pathname
  const isRoadcoin = path === '/roadcoin'
  const route = window.location.pathname
  const isDashboard = path === '/dashboard'
  const isYou = path === '/you'
  const isClaude = path === '/claude'
  const isDashboard = path === '/dashboard'
  const isYou = path === '/you'
  const isCodex = path === '/codex'

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
      fetchTimeline(), fetchTasks(), fetchCommits(), fetchAgents(), fetchRoadcoinWallet(), fetchContradictions(), getNotes()
    ])
    setTimeline(tl); setTasks(ts); setCommits(cs); setAgents(ag); setWallet({ rc: w.balance }); setContradictions(c); setNotesState(n || '')
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
              <NavItem icon={<Activity size={18} />} text="Dashboard" href="/dashboard" />
              <NavItem icon={<User size={18} />} text="You" href="/you" />
              <NavItem icon={<LayoutGrid size={18} />} text="Workspace" href="/" />
              <NavItem icon={<SquareDashedMousePointer size={18} />} text="Projects" />
              <NavItem icon={<Brain size={18} />} text="Agents" />
              <NavItem icon={<Database size={18} />} text="Datasets" />
              <NavItem icon={<ShieldCheck size={18} />} text="Models" />
              <NavItem icon={<Settings size={18} />} text="Integrations" />
              <NavItem icon={<Cpu size={18} />} text="Claude" href="/claude" />
              <NavItem icon={<Cpu size={18} />} text="Codex" href="/codex" />
              <NavItem icon={<Wallet size={18} />} text="RoadCoin" href="/roadcoin" />
              <NavItem icon={<BookOpen size={18} />} text="Roadbook" to="/roadbook" />
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
              {isDashboard && <Dashboard />}
              {isYou && <You />}
              {!isDashboard && !isYou && !isRoadcoin && (
              {!isRoadcoin && !isClaude && (
              {isRoadcoin && <RoadCoin onUpdate={(data)=>setWallet({ rc: data.balance })} />}
              {isCodex && <Codex socket={socket} />}
              {!isRoadcoin && !isCodex && (
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
              )}
              {isRoadcoin && <RoadCoin onUpdate={(data)=>setWallet({ rc: data.balance })} />}
              {isClaude && <Claude socket={socket} />}
              <Routes>
                <Route path="/roadbook" element={<Roadbook />} />
                <Route path="*" element={<Dashboard tab={tab} setTab={setTab} timeline={timeline} tasks={tasks} commits={commits} onAction={onAction} />} />
              </Routes>
            </section>
            {route === '/guardian' ? (
              <Guardian />
            ) : (
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
            )}

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

function NavItem({ icon, text, href }){
  const className = "flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-900 cursor-pointer";
  return href ? (
    <a href={href} className={className}>{icon}<span>{text}</span></a>
  ) : (
    <div className={className}>{icon}<span>{text}</span></div>
  );
function NavItem({ icon, text, to }){
  const navigate = useNavigate()
  return (
    <div onClick={()=> to && navigate(to)} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-900 cursor-pointer">
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

function Dashboard({ tab, setTab, timeline, tasks, commits, onAction }){
  return (
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
  )
}
