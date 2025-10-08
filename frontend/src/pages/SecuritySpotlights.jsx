import React, { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  CirclePause,
  CirclePlay,
  Gauge,
  KeyRound,
  RotateCw,
  Shield,
  Sigma,
} from 'lucide-react'
import { fetchSecuritySpotlights, updateSecuritySpotlight } from '../api'

const ROUTE_KEYS = {
  controlBarrier: 'control-barrier',
  dpAccountant: 'dp-accountant',
  pqHandshake: 'pq-handshake',
}

export default function SecuritySpotlights(){
  const [spotlights, setSpotlights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState({})

  const load = useCallback(async ()=>{
    setError('')
    setLoading(true)
    try{
      const data = await fetchSecuritySpotlights()
      setSpotlights(data || null)
    }catch(err){
      console.error('Failed to load security spotlights', err)
      setSpotlights(null)
      setError('Failed to load security spotlights. Check connectivity and retry.')
    }finally{
      setLoading(false)
    }
  }, [])

  useEffect(()=>{ void load() }, [load])

  function setLocal(panelKey, patch){
    setSpotlights(prev => {
      if(!prev || !prev[panelKey]) return prev
      const currentPanel = prev[panelKey]
      const nextPanel = typeof patch === 'function' ? patch(currentPanel) : { ...currentPanel, ...patch }
      return { ...prev, [panelKey]: nextPanel }
    })
  }

  async function persist(routeKey, payload){
    setError('')
    setSaving(prev => ({ ...prev, [routeKey]: true }))
    try{
      const result = await updateSecuritySpotlight(routeKey, payload)
      if(result?.key && result?.spotlight){
        setSpotlights(prev => ({ ...(prev || {}), [result.key]: result.spotlight }))
      }
    }catch(err){
      console.error('Failed to update spotlight', err)
      setError('Unable to update panel — please retry.')
    }finally{
      setSaving(prev => ({ ...prev, [routeKey]: false }))
    }
  }

  const control = spotlights?.controlBarrier
  const dp = spotlights?.dpAccountant
  const pq = spotlights?.pqHandshake

  const content = (()=>{
    if(loading){
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1,2,3].map(key => (
            <div key={key} className="card p-6 h-64 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      )
    }
    if(!spotlights){
      return (
        <div className="card p-6 bg-slate-900/60 text-slate-300">
          No spotlights available. <button className="underline ml-1" onClick={()=>void load()}>Retry</button>
        </div>
      )
    }
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <ControlBarrierPanel
          data={control}
          onChange={value=>setLocal('controlBarrier', panel => ({
            ...panel,
            requiredSlack: value,
            residualSlack: Math.max((panel.currentSlack ?? 0) - value, 0),
          }))}
          onCommit={value=>{
            if(control && Math.abs((control.requiredSlack ?? 0) - value) < 0.0005) return
            void persist(ROUTE_KEYS.controlBarrier, { requiredSlack: value })
          }}
          onToggle={()=>{
            if(!control) return
            const next = !control.killSwitchEngaged
            setLocal('controlBarrier', panel => ({ ...panel, killSwitchEngaged: next, manualOverride: next }))
            void persist(ROUTE_KEYS.controlBarrier, { killSwitchEngaged: next })
          }}
          saving={Boolean(saving[ROUTE_KEYS.controlBarrier])}
        />
        <DpAccountantPanel
          data={dp}
          onChange={value=>setLocal('dpAccountant', panel => ({
            ...panel,
            epsilonCap: value,
            residualEpsilon: Math.max(value - (panel.epsilonSpent ?? 0), 0),
            budgetUtilization: value > 0 ? Math.min((panel.epsilonSpent ?? 0) / value, 1) : 0,
          }))}
          onCommit={value=>{
            if(dp && Math.abs((dp.epsilonCap ?? 0) - value) < 0.0005) return
            void persist(ROUTE_KEYS.dpAccountant, { epsilonCap: value })
          }}
          onToggleFreeze={()=>{
            if(!dp) return
            const next = !dp.freezeQueries
            setLocal('dpAccountant', panel => ({ ...panel, freezeQueries: next }))
            void persist(ROUTE_KEYS.dpAccountant, { freezeQueries: next })
          }}
          onToggleSynthetic={()=>{
            if(!dp) return
            const next = !dp.syntheticFallback
            setLocal('dpAccountant', panel => ({ ...panel, syntheticFallback: next }))
            void persist(ROUTE_KEYS.dpAccountant, { syntheticFallback: next })
          }}
          saving={Boolean(saving[ROUTE_KEYS.dpAccountant])}
        />
        <PostQuantumPanel
          data={pq}
          onChange={value=>setLocal('pqHandshake', panel => ({
            ...panel,
            keyRotationMinutes: value,
            timeToRotate: Math.max(value - (panel.minutesSinceRotation ?? 0), 0),
          }))}
          onCommit={value=>{
            if(pq && Math.abs((pq.keyRotationMinutes ?? 0) - value) < 0.5) return
            void persist(ROUTE_KEYS.pqHandshake, { keyRotationMinutes: value })
          }}
          onToggle={()=>{
            if(!pq) return
            const next = !pq.haltChannel
            setLocal('pqHandshake', panel => ({ ...panel, haltChannel: next }))
            void persist(ROUTE_KEYS.pqHandshake, { haltChannel: next })
          }}
          onRekey={()=>{
            if(!pq) return
            setLocal('pqHandshake', panel => ({ ...panel, minutesSinceRotation: 0, kemFailures: 0, timeToRotate: panel.keyRotationMinutes ?? 0 }))
            void persist(ROUTE_KEYS.pqHandshake, { forceRekey: true })
          }}
          saving={Boolean(saving[ROUTE_KEYS.pqHandshake])}
        />
      </div>
    )
  })()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Shield size={18} /> Security Spotlights
          </h1>
          <p className="text-xs text-slate-400">
            Barrier guardrails, privacy budgets, and post-quantum handshakes tuned for Lucidia.
          </p>
        </div>
        <button className="badge" onClick={()=>void load()}>Refresh</button>
      </header>
      {error && (
        <div className="flex items-center gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-2">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}
      {content}
    </div>
  )
}

function ControlBarrierPanel({ data, onChange, onCommit, onToggle, saving }){
  if(!data) return <PlaceholderCard title="Control Barrier Functions" />
  const slackPercent = clamp01((data.currentSlack ?? 0) / 0.5)
  const requiredPercent = clamp01((data.requiredSlack ?? 0) / 0.5)

  return (
    <div className="card p-5 space-y-4">
      <PanelHeader
        icon={<Gauge size={18} />}
        title="Control Barrier Functions"
        subtitle="Keep dynamics inside the safe tube."
        status={data.killSwitchEngaged ? 'SAFE MODE' : data.manualOverride ? 'MANUAL' : 'AUTOPILOT'}
        tone={data.killSwitchEngaged ? 'warning' : 'accent'}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Slack envelope</span>
          <span className="text-slate-200 font-semibold">{formatPercent(data.currentSlack, 1)}</span>
        </div>
        <div className="relative h-2.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0"
            style={{ left: `${requiredPercent * 100}%` }}
          >
            <div className="w-0.5 h-full bg-white/70" />
          </div>
          <div
            className="h-full rounded-full"
            style={{ width: `${slackPercent * 100}%`, background: 'linear-gradient(90deg,var(--accent-2),var(--accent))' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>0%</span>
          <span>Floor {formatPercent(data.requiredSlack, 1)}</span>
        </div>
      </div>
      <RangeControl
        label="Required slack floor"
        value={data.requiredSlack ?? 0}
        min={0.05}
        max={0.5}
        step={0.01}
        formatter={value=>formatPercent(value, 1)}
        onChange={onChange}
        onCommit={onCommit}
      />
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Stat label="Residual slack" value={formatPercent(data.residualSlack, 1)} />
        <Stat label="Infeasibility" value={formatPercent(data.infeasibilityRate, 2)} />
        <Stat label="Interventions" value={formatNumber(data.interventionsToday, 0)} />
        <Stat label="Last failsafe" value={formatDate(data.lastFailsafe)} />
      </dl>
      <div className="flex gap-2 flex-wrap">
        <button
          className={`badge flex items-center gap-2 ${saving ? 'opacity-60 cursor-wait' : ''}`}
          onClick={onToggle}
          disabled={saving}
        >
          {data.killSwitchEngaged ? <CirclePlay size={14} /> : <CirclePause size={14} />}
          {data.killSwitchEngaged ? 'Release brake' : 'Engage brake'}
        </button>
      </div>
    </div>
  )
}

function DpAccountantPanel({ data, onChange, onCommit, onToggleFreeze, onToggleSynthetic, saving }){
  if(!data) return <PlaceholderCard title="Differential Privacy Accountant" />
  const cap = data.epsilonCap ?? 0
  const spent = data.epsilonSpent ?? 0
  const utilization = cap > 0 ? clamp01(spent / cap) : 0

  return (
    <div className="card p-5 space-y-4">
      <PanelHeader
        icon={<Sigma size={18} />}
        title="Differential Privacy Accountant"
        subtitle="Meter every ε leak."
        status={data.freezeQueries ? 'FROZEN' : data.syntheticFallback ? 'SYNTHETIC' : 'LIVE'}
        tone={data.freezeQueries ? 'warning' : 'accent'}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>ε spent</span>
          <span className="text-slate-200 font-semibold">{formatNumber(spent, 2)} / {formatNumber(cap, 2)}</span>
        </div>
        <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${utilization * 100}%`, background: 'linear-gradient(90deg,var(--accent-3),var(--accent-2))' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>0</span>
          <span>{formatPercent(data.budgetUtilization, 1)} used</span>
        </div>
      </div>
      <RangeControl
        label="ε cap"
        value={cap}
        min={0.5}
        max={15}
        step={0.1}
        formatter={value=>formatNumber(value, 1)}
        onChange={onChange}
        onCommit={onCommit}
      />
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Stat label="Residual ε" value={formatNumber(data.residualEpsilon, 2)} />
        <Stat label="δ" value={formatScientific(data.delta)} />
        <Stat label="Releases today" value={formatNumber(data.releasesToday, 0)} />
        <Stat label="Moments λ" value={formatNumber(data.momentsWindow, 2)} />
      </dl>
      <div className="flex gap-2 flex-wrap">
        <button
          className={`badge flex items-center gap-2 ${saving ? 'opacity-60 cursor-wait' : ''}`}
          onClick={onToggleFreeze}
          disabled={saving}
        >
          {data.freezeQueries ? <CirclePlay size={14} /> : <CirclePause size={14} />}
          {data.freezeQueries ? 'Resume queries' : 'Freeze new queries'}
        </button>
        <button
          className={`badge flex items-center gap-2 ${saving ? 'opacity-60 cursor-wait' : ''}`}
          onClick={onToggleSynthetic}
          disabled={saving}
        >
          <Shield size={14} />
          {data.syntheticFallback ? 'Return to live data' : 'Shift to synthetic data'}
        </button>
      </div>
    </div>
  )
}

function PostQuantumPanel({ data, onChange, onCommit, onToggle, onRekey, saving }){
  if(!data) return <PlaceholderCard title="Post-Quantum Handshake" />
  const successRate = clamp01(data.hybridSuccessRate ?? 0)
  const pinnedRate = clamp01(data.transcriptPinnedRate ?? 0)

  return (
    <div className="card p-5 space-y-4">
      <PanelHeader
        icon={<KeyRound size={18} />}
        title="Post-Quantum Handshake"
        subtitle="Hybrid KEMs with transcript pins."
        status={data.haltChannel ? 'HALTED' : 'ONLINE'}
        tone={data.haltChannel ? 'warning' : 'accent'}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Hybrid success</span>
          <span className="text-slate-200 font-semibold">{formatPercent(successRate, 1)}</span>
        </div>
        <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${successRate * 100}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent-2))' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>0%</span>
          <span>Transcript pin {formatPercent(pinnedRate, 1)}</span>
        </div>
      </div>
      <RangeControl
        label="Key rotation TTL (minutes)"
        value={data.keyRotationMinutes ?? 0}
        min={5}
        max={240}
        step={5}
        formatter={value=>`${Math.round(value)}m`}
        onChange={onChange}
        onCommit={onCommit}
      />
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Stat label="KEM failures" value={formatNumber(data.kemFailures, 0)} />
        <Stat label="TTL remaining" value={`${formatNumber(data.timeToRotate, 0)}m`} />
        <Stat label="Minutes since rotate" value={formatNumber(data.minutesSinceRotation, 0)} />
        <Stat label="Transcript pinned" value={formatPercent(pinnedRate, 1)} />
      </dl>
      <div className="flex gap-2 flex-wrap">
        <button
          className={`badge flex items-center gap-2 ${saving ? 'opacity-60 cursor-wait' : ''}`}
          onClick={onToggle}
          disabled={saving}
        >
          {data.haltChannel ? <CirclePlay size={14} /> : <CirclePause size={14} />}
          {data.haltChannel ? 'Resume channel' : 'Halt channel'}
        </button>
        <button
          className={`badge flex items-center gap-2 ${saving ? 'opacity-60 cursor-wait' : ''}`}
          onClick={onRekey}
          disabled={saving}
        >
          <RotateCw size={14} />
          Force rekey
        </button>
      </div>
    </div>
  )
}

function RangeControl({ label, value, min, max, step, formatter, onChange, onCommit }){
  const safeValue = Number.isFinite(value) ? value : min
  const handleChange = event => {
    const next = parseFloat(event.target.value)
    if(Number.isFinite(next) && onChange) onChange(next)
  }
  const handleCommit = event => {
    const next = parseFloat(event.target.value)
    if(Number.isFinite(next) && onCommit) onCommit(next)
  }
  return (
    <div className="space-y-1">
      <label className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200 font-semibold">{formatter(safeValue)}</span>
      </label>
      <input
        type="range"
        value={safeValue}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        onPointerUp={handleCommit}
        onBlur={handleCommit}
        className="w-full accent-indigo-400"
      />
    </div>
  )
}

function PanelHeader({ icon, title, subtitle, status, tone = 'accent' }){
  const toneClass = tone === 'warning' ? 'bg-amber-500/10 text-amber-200 border border-amber-500/40' : 'bg-indigo-500/10 text-indigo-200 border border-indigo-500/40'
  return (
    <header className="flex items-start justify-between gap-2">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span>{title}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
      <span className={`px-2 py-1 rounded-lg text-[11px] uppercase tracking-wide ${toneClass}`}>
        {status}
      </span>
    </header>
  )
}

function Stat({ label, value }){
  return (
    <div className="space-y-1">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-200">{value}</dd>
    </div>
  )
}

function PlaceholderCard({ title }){
  return (
    <div className="card p-5 space-y-3 bg-slate-900/40 border border-dashed border-slate-700 text-slate-400">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Shield size={16} />
        <span>{title}</span>
      </div>
      <p className="text-xs">Telemetry not available.</p>
    </div>
  )
}

function formatPercent(value, digits = 0){
  if(typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

function formatNumber(value, digits = 0){
  if(value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(digits)
}

function formatScientific(value){
  if(typeof value !== 'number' || Number.isNaN(value)) return '—'
  return value.toExponential(2)
}

function formatDate(value){
  if(!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function clamp01(value){
  if(!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 1)
}
