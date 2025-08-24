import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import { API_BASE, setToken, login, me, fetchTimeline, fetchTasks, fetchCommits, fetchAgents, fetchRoadcoinWallet, fetchContradictions, getNotes, setNotes, action } from './api'
import { API_BASE, setToken, login, me, fetchTimeline, fetchTasks, fetchCommits, fetchAgents, fetchWallet, fetchContradictions, getNotes, setNotes, action } from './api'
import Guardian from './Guardian.jsx'
import { Activity, Brain, Cpu, Database, GitCommit, LayoutGrid, Rocket, Settings, ShieldCheck, SquareDashedMousePointer, Wallet } from 'lucide-react'
import { Activity, Brain, Cpu, Database, GitCommit, LayoutGrid, Rocket, Settings, ShieldCheck, SquareDashedMousePointer, Wallet, User } from 'lucide-react'
import { Activity, Brain, Cpu, Database, GitCommit, LayoutGrid, Rocket, Settings, ShieldCheck, SquareDashedMousePointer, Wallet, BookOpen } from 'lucide-react'
import io from 'socket.io-client'
import { Routes, Route, NavLink } from 'react-router-dom'
import { API_BASE, setToken, login, me, fetchTimeline, fetchTasks, fetchCommits, fetchAgents, fetchWallet, fetchContradictions, getNotes, setNotes, action } from './api'
import { Activity, Brain, Database, LayoutGrid, Rocket, Settings, ShieldCheck, SquareDashedMousePointer, Wallet } from 'lucide-react'
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
import Subscribe from './Subscribe.jsx'
import io from 'socket.io-client'
import { Routes, Route, NavLink } from 'react-router-dom'
import { API_BASE, setToken, login, me, fetchTimeline, fetchTasks, fetchCommits, fetchAgents, fetchWallet, fetchContradictions, getNotes, setNotes, action } from './api'
import { Activity, Brain, Database, LayoutGrid, Settings, ShieldCheck, SquareDashedMousePointer } from 'lucide-react'
import Login from './components/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RoadView from './pages/RoadView.jsx'
import Orchestrator from './Orchestrator.jsx'
import Manifesto from './components/Manifesto.jsx'

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
  const isSubscribe = path === '/subscribe'

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if (token) setToken(token)
    (async()=>{
      try {
        if (token) {
          const u = await me()
          setUser(u)
          await bootData()
          connectSocket()
        }
      } catch(e) {}
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

  if (isSubscribe) {
    return <Subscribe />
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
              <NavItem icon={<Rocket size={18} />} text="Subscribe" href="/subscribe" />
              <NavItem icon={<BookOpen size={18} />} text="Roadbook" to="/roadbook" />
              <NavItem to="/" icon={<Activity size={18} />} text="Chat" />
              <NavItem to="/projects" icon={<SquareDashedMousePointer size={18} />} text="Projects" />
              <NavItem to="/agents" icon={<Brain size={18} />} text="Agents" />
              <NavItem to="/datasets" icon={<Database size={18} />} text="Datasets" />
              <NavItem to="/models" icon={<ShieldCheck size={18} />} text="Models" />
              <NavItem to="/integrations" icon={<Settings size={18} />} text="Integrations" />
              <NavItem to="/roadview" icon={<LayoutGrid size={18} />} text="RoadView" />
              <NavItem icon={<Rocket size={18} />} text="Orchestrator" to="/orchestrator" />
              <NavItem icon={<Rocket size={18} />} text="Manifesto" href="/manifesto" />
            </nav>
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
              {path === '/manifesto' ? (
                <Manifesto />
              ) : (
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
              <Routes>
                <Route path="/" element={<Dashboard tab={tab} setTab={setTab} timeline={timeline} tasks={tasks} commits={commits} onAction={onAction} />} />
                <Route path="/orchestrator" element={<Orchestrator socket={socket} />} />
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
              <AgentStack stream={stream} setStream={setStream} system={system} wallet={wallet} contradictions={contradictions}
                notes={notes} setNotes={async (v)=>{ setNotesState(v); await setNotes(v); }} />
            </section>
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
function NavItem({ icon, text, to }){
  return (
    <NavLink to={to} className={({isActive})=>`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-900 ${isActive?'text-white':'text-slate-300'}`}>
      {icon}<span>{text}</span>
    </NavLink>
  )
function NavItem({ icon, text, to }){
  const cls = 'flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-900 cursor-pointer'
  if (to) {
    return (
      <NavLink to={to} className={({isActive}) => `${cls} ${isActive ? 'bg-slate-900 text-white' : ''}`}>
        {icon}<span>{text}</span>
      </NavLink>
    )
  }
  return (<div className={cls}>{icon}<span>{text}</span></div>)
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
  const Comp = href ? 'a' : 'div'
  return (
    <Comp href={href} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-900 cursor-pointer">
      {icon}<span>{text}</span>
    </Comp>
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
