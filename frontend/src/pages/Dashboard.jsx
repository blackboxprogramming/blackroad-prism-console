import React from 'react'
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
        <AgentStack stream={stream} setStream={setStream} system={system} wallet={wallet} contradictions={contradictions} notes={notes} setNotes={setNotes} />
        <WhisperCard />
      </section>
    </>
  )
}

function Tab({ children, active, onClick }){
  return (
    <button onClick={onClick} className={`py-3 border-b-2 ${active?'border-indigo-500 text-white':'border-transparent text-slate-400 hover:text-slate-200'}`}>{children}</button>
  )
}
