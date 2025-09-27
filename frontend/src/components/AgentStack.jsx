import React from 'react'
import { Cpu, Activity, Wallet as WalletIcon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import PiConsole from './PiConsole.jsx'

function MiniChart({ data, dataKey }){
  return (
    <div className="h-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={[0,100]} hide />
          <XAxis hide />
          <Line type="monotone" dataKey={dataKey} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const ring = (v) => (
  <div className="relative inline-flex items-center justify-center">
    <svg viewBox="0 0 36 36" className="w-12 h-12">
      <path d="M18 2a16 16 0 1 1 0 32a16 16 0 1 1 0-32" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
      <path d="M18 2a16 16 0 1 1 0 32" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${v*100}, 100`} />
    </svg>
    <span className="absolute text-sm">{Math.round(v*100)}%</span>
  </div>
)

export default function AgentStack({ stream, setStream, system, wallet, contradictions, notes, setNotes }){
  const historyRef = React.useRef([])
  const [history, setHistory] = React.useState([])

  React.useEffect(()=>{
    historyRef.current = [...historyRef.current, { cpu: system.cpu, mem: system.mem, gpu: system.gpu }].slice(-40)
    setHistory(historyRef.current)
  }, [system])

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Agent Stack</div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="agent" defaultChecked /> Phi
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="agent" /> GPT
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="agent" /> Mistral
          </label>
          <label className="ml-auto flex items-center gap-2">
            <span>Stream</span>
            <input type="checkbox" checked={stream} onChange={e=>setStream(e.target.checked)} />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="card p-3">
            <div className="flex items-center gap-2 text-slate-300"><Cpu size={16}/> CPU</div>
            <MiniChart data={history} dataKey="cpu" />
          </div>
          <div className="card p-3">
            <div className="flex items-center gap-2 text-slate-300"><Activity size={16}/> Memory</div>
            <MiniChart data={history} dataKey="mem" />
          </div>
          <div className="card p-3">
            <div className="flex items-center gap-2 text-slate-300"><Activity size={16}/> GPU</div>
            <MiniChart data={history} dataKey="gpu" />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold">Wallet</div>
        <div className="flex items-center gap-3 mt-2">
          <WalletIcon size={18} /><div className="text-xl font-semibold">{wallet.rc.toFixed(2)} RC</div>
          <button className="ml-auto btn" onClick={()=>alert('Stake… sample')}>Stake</button>
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold">Contradictions</div>
        <div className="text-2xl mt-1">{contradictions.issues} Issues</div>
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-2">Session Notes</div>
        <textarea className="input w-full h-28 resize-none" value={notes} onChange={e=>setNotes(e.target.value)} />
      </div>
      <PiConsole />
    </div>
  )
}
