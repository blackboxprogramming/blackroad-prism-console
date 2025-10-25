import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, Eye, Loader2, Pause, RefreshCw, RotateCcw, Save } from 'lucide-react'
import SpawnButton from '../components/SpawnButton.jsx'
import StatusToast from '../components/StatusToast.jsx'
import {
  fetchAgentRegistry,
  spawnAgent,
  updateAgentMetadata,
  revertAgentRegistration,
} from '../api'

const MODEL_OPTIONS = [
  'GPT-4o',
  'Claude 3.5',
  'LLaMA 3',
  'Gemini 1.5',
  'Mistral Large',
]

const DOMAIN_OPTIONS = [
  'Philosophy',
  'Math',
  'Coding',
  'Operations',
  'Research',
  'Strategy',
]

const INITIAL_FORM = {
  name: '',
  base_model: MODEL_OPTIONS[0],
  domain: DOMAIN_OPTIONS[0],
  description: '',
  parent_agent: '',
}

export default function AgentLineage(){
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ type: 'success', message: '' })
  const [expanded, setExpanded] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [busyAgent, setBusyAgent] = useState(null)

  const parentOptions = useMemo(() => agents.map(agent => ({ id: agent.id, name: agent.name })), [agents])

  const loadAgents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAgentRegistry()
      const list = Array.isArray(data?.agents) ? data.agents : []
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setAgents(list)
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to load agents'
      setToast({ type: 'error', message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  useEffect(() => {
    setDrafts(prev => {
      const next = {}
      agents.forEach(agent => {
        next[agent.id] = {
          description: prev[agent.id]?.description ?? agent.description ?? '',
          domain: prev[agent.id]?.domain ?? agent.domain ?? DOMAIN_OPTIONS[0],
        }
      })
      return next
    })
  }, [agents])

  const handleFormChange = (field, value) => {
    setFormErrors(errors => ({ ...errors, [field]: '' }))
    setForm(current => ({ ...current, [field]: value }))
  }

  const validateForm = () => {
    const errors = {}
    if(!form.name.trim()) errors.name = 'Name is required'
    if(!form.base_model) errors.base_model = 'Base model is required'
    if(!form.domain) errors.domain = 'Domain is required'
    if(!form.description.trim()) errors.description = 'Description is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSpawn = async (event) => {
    event.preventDefault()
    if(submitting){
      return
    }
    if(!validateForm()){
      return
    }

    setSubmitting(true)
    try {
      await spawnAgent({
        name: form.name.trim(),
        base_model: form.base_model,
        domain: form.domain,
        description: form.description.trim(),
        parent_agent: form.parent_agent || null,
      })
      setToast({ type: 'success', message: `Agent ${form.name} is being provisioned.` })
      setForm(INITIAL_FORM)
      setFormOpen(false)
      await loadAgents()
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to create agent'
      setToast({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleExpanded = (agent) => {
    setExpanded(current => current === agent.id ? null : agent.id)
    setDrafts(prev => ({
      ...prev,
      [agent.id]: {
        description: prev[agent.id]?.description ?? agent.description ?? '',
        domain: prev[agent.id]?.domain ?? agent.domain ?? DOMAIN_OPTIONS[0],
      },
    }))
  }

  const handleDraftChange = (agentId, field, value) => {
    setDrafts(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [field]: value,
      },
    }))
  }

  const performAgentAction = async (agentId, action, fn) => {
    setBusyAgent(agentId)
    try {
      await fn()
      setToast({ type: 'success', message: action })
      await loadAgents()
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'Operation failed'
      setToast({ type: 'error', message })
    } finally {
      setBusyAgent(null)
    }
  }

  const handleSaveDetails = async (agentId) => {
    const draft = drafts[agentId]
    if(!draft){
      return
    }
    await performAgentAction(agentId, 'Agent updated', async () => {
      await updateAgentMetadata(agentId, {
        description: draft.description,
        domain: draft.domain,
      })
    })
  }

  const handleStatusChange = async (agentId, status) => {
    await performAgentAction(agentId, `Agent ${status}`, async () => {
      await updateAgentMetadata(agentId, { status })
    })
  }

  const handleRevert = async (agentId) => {
    await performAgentAction(agentId, 'Agent reverted', async () => {
      await revertAgentRegistration(agentId)
    })
  }

  const closeToast = () => setToast(current => ({ ...current, message: '' }))

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agent Lineage</h1>
          <p className="text-sm text-slate-400">Spawn, inspect, and manage every agent in the network.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAgents}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <SpawnButton onClick={() => setFormOpen(true)} disabled={submitting}>
            Create Agent
          </SpawnButton>
        </div>
      </header>

      {formOpen && (
        <AgentSpawnForm
          form={form}
          onChange={handleFormChange}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSpawn}
          errors={formErrors}
          submitting={submitting}
          parentOptions={parentOptions}
        />
      )}

      <section className="card overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-lg font-semibold">Registered Agents</h2>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Loading
            </div>
          )}
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/40 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Domain</th>
                <th className="px-4 py-3 text-left">Parent</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Hugging Face</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              {(!agents.length && !loading) && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                    No agents registered yet.
                  </td>
                </tr>
              )}
              {agents.map(agent => {
                const isExpanded = expanded === agent.id
                const draft = drafts[agent.id] || { description: agent.description || '', domain: agent.domain }
                return (
                  <React.Fragment key={agent.id}>
                    <tr className={isExpanded ? 'bg-slate-900/40' : ''}>
                      <td className="px-4 py-3 font-medium">{agent.name}</td>
                      <td className="px-4 py-3 text-slate-300">{agent.base_model}</td>
                      <td className="px-4 py-3 text-slate-300">{agent.domain}</td>
                      <td className="px-4 py-3 text-slate-300">{agent.parent_agent || '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(agent.created_at)}</td>
                      <td className="px-4 py-3 text-indigo-300">
                        {agent.huggingface_space ? (
                          <a href={agent.huggingface_space} className="hover:underline" target="_blank" rel="noreferrer">
                            View Space
                          </a>
                        ) : (
                          <span className="text-slate-500">pending…</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                          {agent.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            label={isExpanded ? 'Hide' : 'View'}
                            icon={<Eye size={14} />}
                            onClick={() => handleToggleExpanded(agent)}
                          />
                          <ActionButton
                            label="Pause"
                            icon={<Pause size={14} />}
                            onClick={() => handleStatusChange(agent.id, 'paused')}
                            disabled={busyAgent === agent.id}
                          />
                          <ActionButton
                            label="Archive"
                            icon={<Archive size={14} />}
                            onClick={() => handleStatusChange(agent.id, 'archived')}
                            disabled={busyAgent === agent.id}
                          />
                          <ActionButton
                            label="Revert"
                            icon={<RotateCcw size={14} />}
                            onClick={() => handleRevert(agent.id)}
                            disabled={busyAgent === agent.id}
                          />
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-900/50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Domain</label>
                              <select
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                                value={draft.domain || ''}
                                onChange={(event) => handleDraftChange(agent.id, 'domain', event.target.value)}
                              >
                                {DOMAIN_OPTIONS.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">Description</label>
                              <textarea
                                className="mt-2 h-32 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                                value={draft.description || ''}
                                onChange={(event) => handleDraftChange(agent.id, 'description', event.target.value)}
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <ActionButton
                              label={busyAgent === agent.id ? 'Saving…' : 'Save changes'}
                              icon={<Save size={14} />}
                              onClick={() => handleSaveDetails(agent.id)}
                              disabled={busyAgent === agent.id}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <StatusToast type={toast.type} message={toast.message} onClose={closeToast} />
    </div>
  )
}

function AgentSpawnForm({ form, onChange, onCancel, onSubmit, errors, submitting, parentOptions }){
  return (
    <form onSubmit={onSubmit} className="card space-y-4 border border-slate-800 bg-slate-950/60 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Agent name"
          required
          error={errors.name}
        >
          <input
            type="text"
            value={form.name}
            onChange={event => onChange('name', event.target.value)}
            className="input w-full"
            placeholder="e.g. Hermes"
          />
        </Field>
        <Field
          label="Base model"
          required
          error={errors.base_model}
        >
          <select
            value={form.base_model}
            onChange={event => onChange('base_model', event.target.value)}
            className="input w-full"
          >
            {MODEL_OPTIONS.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </Field>
        <Field
          label="Domain"
          required
          error={errors.domain}
        >
          <select
            value={form.domain}
            onChange={event => onChange('domain', event.target.value)}
            className="input w-full"
          >
            {DOMAIN_OPTIONS.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </Field>
        <Field label="Parent agent">
          <select
            value={form.parent_agent}
            onChange={event => onChange('parent_agent', event.target.value)}
            className="input w-full"
          >
            <option value="">None</option>
            {parentOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </Field>
        <Field
          label="Description"
          required
          error={errors.description}
          className="md:col-span-2"
        >
          <textarea
            value={form.description}
            onChange={event => onChange('description', event.target.value)}
            className="input h-32 w-full"
            placeholder="What makes this agent unique?"
          />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          <span>{submitting ? 'Creating…' : 'Create agent'}</span>
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, required, children, className }){
  return (
    <label className={`block text-sm ${className || ''}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}{required ? ' *' : ''}
      </span>
      <div className="mt-2">{children}</div>
      {error && <div className="mt-1 text-xs text-rose-400">{error}</div>}
    </label>
  )
}

function ActionButton({ icon, label, onClick, disabled }){
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="badge inline-flex items-center gap-1 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function formatDate(value){
  if(!value){
    return '—'
  }
  try{
    const date = new Date(value)
    return date.toLocaleString()
  }catch{
    return value
  }
}
