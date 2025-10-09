import React, { useEffect, useRef, useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import io from 'socket.io-client'
import {
  API_BASE,
  setToken,
  login,
  me,
  fetchTimeline,
  fetchTasks,
  fetchCommits,
  fetchAgents,
  fetchRoadcoinWallet,
  fetchContradictions,
  getNotes,
  setNotes as saveNotes,
  action,
} from './api'
import Guardian from './Guardian.jsx'
import {
  Activity,
  Brain,
  Cpu,
  GitCommit,
  LayoutGrid,
  Rocket,
  Shield,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  Wallet,
  User,
  BookOpen,
} from 'lucide-react'
import Timeline from './components/Timeline.jsx'
import Tasks from './components/Tasks.jsx'
import Commits from './components/Commits.jsx'
import AgentStack from './components/AgentStack.jsx'
import Login from './components/Login.jsx'
import RoadCoin from './components/RoadCoin.jsx'
import You from './components/You.jsx'
import Claude from './components/Claude.jsx'
import Codex from './components/Codex.jsx'
import Roadbook from './components/Roadbook.jsx'
import Subscribe from './Subscribe.jsx'
import Orchestrator from './Orchestrator.jsx'
import Manifesto from './components/Manifesto.jsx'
import AutoHeal from './pages/AutoHeal.jsx'
import RoadView from './pages/RoadView.jsx'
import Git from './pages/Git.jsx'
import SecuritySpotlights from './pages/SecuritySpotlights.jsx'

export default function App(){
  const location = useLocation()
  const [authChecked, setAuthChecked] = useState(false)
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
  const [socket, setSocket] = useState(null)
  const socketRef = useRef(null)
  const streamRef = useRef(stream)

  useEffect(()=>{ streamRef.current = stream }, [stream])

  useEffect(()=>{
    const token = localStorage.getItem('token')
    if(!token){
      setAuthChecked(true)
      return
    }
    setToken(token)
    me()
      .then(async(u)=>{
        setUser(u)
        await bootData()
        connectSocket()
      })
      .catch(err=>{
        if(err?.response?.status === 401){
          localStorage.removeItem('token')
          setToken('')
        }
      })
      .finally(()=>setAuthChecked(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(()=>()=>{ socketRef.current?.close() }, [])

  async function bootData(){
    const results = await Promise.allSettled([
      fetchTimeline(),
      fetchTasks(),
      fetchCommits(),
      fetchAgents(),
      fetchRoadcoinWallet(),
      fetchContradictions(),
      getNotes(),
    ])
    const [tl, ts, cs, ag, w, c, n] = results
    if(tl.status === 'fulfilled') setTimeline(tl.value || [])
    else setTimeline([])
    if(ts.status === 'fulfilled') setTasks(ts.value || [])
    else setTasks([])
    if(cs.status === 'fulfilled') setCommits(cs.value || [])
    else setCommits([])
    if(ag.status === 'fulfilled') setAgents(ag.value || [])
    else setAgents([])
    if(w.status === 'fulfilled'){
      const data = w.value
      const balance = typeof data?.balance === 'number' ? data.balance : typeof data?.rc === 'number' ? data.rc : 0
      setWallet({ rc: balance })
    }
    if(c.status === 'fulfilled') setContradictions(c.value || { issues: 0 })
    else setContradictions({ issues: 0 })
    if(n.status === 'fulfilled') setNotesState(n.value || '')
    else setNotesState('')
  }

  function connectSocket(){
    socketRef.current?.close()
    const s = io(API_BASE, { transports: ['websocket'] })
    socketRef.current = s
    setSocket(s)

    s.on('system:update', payload => {
      if(streamRef.current && payload){
        setSystem({
          cpu: payload.cpu ?? 0,
          mem: payload.mem ?? 0,
          gpu: payload.gpu ?? 0,
          net: payload.net ?? 0,
        })
      }
    })

    s.on('timeline:new', message => {
      if(message?.item){
        setTimeline(prev => [message.item, ...prev])
      }
    })

    s.on('wallet:update', payload => {
      const balance = typeof payload?.balance === 'number'
        ? payload.balance
        : typeof payload?.rc === 'number'
          ? payload.rc
          : null
      if(balance !== null){
        setWallet({ rc: balance })
      }
    })

    s.on('notes:update', value => {
      setNotesState(value || '')
    })

    s.on('agents:update', value => {
      if(Array.isArray(value)) setAgents(value)
    })
  }

  async function handleLogin(username, password){
    const { token, user: nextUser } = await login(username, password)
    localStorage.setItem('token', token)
    setToken(token)
    setUser(nextUser)
    await bootData()
    connectSocket()
  }

  async function handleAction(name){
    try{
      await action(name)
    }catch(err){
      console.error('Action failed', err)
    }
  }

  async function handleNotesChange(value){
    setNotesState(value)
    try{
      await saveNotes(value)
    }catch(err){
      console.error('Failed to save notes', err)
    }
  }

  function handleWalletUpdate(data){
    const balance = typeof data?.balance === 'number' ? data.balance : typeof data?.rc === 'number' ? data.rc : wallet.rc
    setWallet({ rc: balance })
  }

  if(location.pathname === '/subscribe'){
    return <Subscribe />
  }

  if(!authChecked){
    return <div className="min-h-screen bg-slate-950" />
  }

  const currentPath = location.pathname
  const navItems = [
    { key: 'dashboard', to: '/dashboard', text: 'Dashboard', icon: <Activity size={18} />, match: path => path === '/' || path === '/dashboard' },
    { key: 'you', to: '/you', text: 'You', icon: <User size={18} /> },
    { key: 'roadview', to: '/roadview', text: 'RoadView', icon: <LayoutGrid size={18} /> },
    { key: 'autoheal', to: '/autoheal', text: 'Auto-Heal', icon: <HeartPulse size={18} /> },
    { key: 'security', to: '/security', text: 'Security Spotlights', icon: <Shield size={18} /> },
    { key: 'guardian', to: '/guardian', text: 'Guardian', icon: <ShieldCheck size={18} /> },
    { key: 'claude', to: '/claude', text: 'Claude', icon: <Cpu size={18} /> },
    { key: 'codex', to: '/codex', text: 'Codex', icon: <Brain size={18} /> },
    { key: 'roadcoin', to: '/roadcoin', text: 'RoadCoin', icon: <Wallet size={18} /> },
    { key: 'orchestrator', to: '/orchestrator', text: 'Orchestrator', icon: <Rocket size={18} /> },
    { key: 'roadbook', to: '/roadbook', text: 'Roadbook', icon: <BookOpen size={18} /> },
    { key: 'manifesto', to: '/manifesto', text: 'Manifesto', icon: <BookOpen size={18} /> },
    { key: 'git', to: '/git', text: 'Git', icon: <GitCommit size={18} /> },
    { key: 'subscribe', href: '/subscribe', text: 'Subscribe', icon: <Rocket size={18} /> },
    { key: 'novelty', to: '/novelty', text: 'Novelty Dashboard', icon: <Sparkles size={18} /> },
  ]

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {!user && <Login onLogin={handleLogin} />}
      {user && (
        <>
          <aside className="w-64 p-4 space-y-6 border-r border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2 text-xl font-semibold">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-500" />
              BlackRoad.io
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavItem
                  key={item.key}
                  icon={item.icon}
                  text={item.text}
                  to={item.to}
                  href={item.href}
                  currentPath={currentPath}
                  match={item.match}
                />
              ))}
            </nav>
          </aside>

          <main className="flex-1 px-6 py-4 grid grid-cols-12 gap-6 items-start">
            <Routes>
              <Route path="/" element={<HomeView tab={tab} setTab={setTab} timeline={timeline} tasks={tasks} commits={commits} onAction={handleAction} />} />
              <Route path="/dashboard" element={<HomeView tab={tab} setTab={setTab} timeline={timeline} tasks={tasks} commits={commits} onAction={handleAction} />} />
              <Route path="/you" element={<Section><You /></Section>} />
              <Route path="/roadview" element={<Section><RoadView agents={agents} /></Section>} />
              <Route path="/autoheal" element={<Section><AutoHeal /></Section>} />
              <Route path="/security" element={<Section><SecuritySpotlights /></Section>} />
              <Route path="/guardian" element={<Guardian />} />
              <Route path="/claude" element={<Section><Claude socket={socket} /></Section>} />
              <Route path="/codex" element={<Section><Codex socket={socket} /></Section>} />
              <Route path="/roadcoin" element={<Section><RoadCoin onUpdate={handleWalletUpdate} /></Section>} />
              <Route path="/orchestrator" element={<Section><Orchestrator socket={socket} /></Section>} />
              <Route path="/roadbook" element={<Section><Roadbook /></Section>} />
              <Route path="/manifesto" element={<Section><Manifesto /></Section>} />
              <Route path="/git" element={<Section><Git /></Section>} />
            </Routes>

            <section className="col-span-4 flex flex-col gap-4">
              <AgentStack
                stream={stream}
                setStream={setStream}
                system={system}
                wallet={wallet}
                contradictions={contradictions}
                notes={notes}
                setNotes={handleNotesChange}
              />
            </section>
          </main>
        </>
      )}
    </div>
  )
}

function NavItem({ icon, text, to, href, currentPath, match }){
  const base = 'flex items-center gap-3 px-2 py-2 rounded-xl transition-colors'
  const isActive = match ? match(currentPath) : to ? currentPath === to : false
  const className = `${base} ${isActive ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-900/60'}`

  if(href){
    return (
      <a href={href} className={className}>
        {icon}
        <span>{text}</span>
      </a>
    )
  }

  return (
    <NavLink to={to} className={className}>
      {icon}
      <span>{text}</span>
    </NavLink>
  )
}

function Section({ children }){
  return <section className="col-span-8">{children}</section>
}

function HomeView({ tab, setTab, timeline, tasks, commits, onAction }){
  return (
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
  )
}

function Tab({ children, active, onClick }){
  return (
    <button
      onClick={onClick}
      className={`py-3 border-b-2 ${active ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
    >
      {children}
    </button>
  )
}
