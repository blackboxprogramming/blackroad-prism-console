import { useEffect, useState } from 'react'

export default function Agents() {
  const [agents, setAgents] = useState([])

  useEffect(() => {
    const localAgents = JSON.parse(localStorage.getItem('prismLocalAgents') || '[]').map(a => ({
      ...a,
      location: 'local'
    }))
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => {
        const cloudAgents = (d.agents || []).map(a => ({ ...a, location: 'cloud' }))
        setAgents([...localAgents, ...cloudAgents])
      })
      .catch(() => setAgents(localAgents))
  }, [])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Agents</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-1">Name</th>
            <th className="text-left p-1">Location</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(a => (
            <tr key={a.name} className="border-t border-white/10">
              <td className="p-1">{a.name}</td>
              <td className="p-1">{a.location === 'cloud' ? '🌐 cloud' : '🖥 local'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
