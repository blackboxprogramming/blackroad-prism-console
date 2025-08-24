import { useEffect, useState } from 'react'

function RightSidebar(){
  const [agents, setAgents] = useState([])
  const [contradictions, setContradictions] = useState({ issues: 0 })
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents || [])).catch(() => {})
    fetch('/api/contradictions').then(r => r.json()).then(d => setContradictions(d.contradictions || { issues: 0 })).catch(() => {})
    fetch('/api/notes').then(r => r.json()).then(d => setNotes(d.notes || '')).catch(() => {})
  }, [])

  const saveNotes = async v => {
    setNotes(v)
    await fetch('/api/notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ notes: v }) }).catch(() => {})
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="font-semibold">Agent Stack</div>
        <div className="mt-2 space-y-1 text-sm">
          {agents.map(a => (
            <label key={a.id} className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> {a.name}
            </label>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="font-semibold">Contradictions</div>
        <div className="text-2xl mt-1">{contradictions.issues} Issues</div>
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-2">Session Notes</div>
        <textarea
          className="w-full h-28 p-2 rounded bg-neutral-900 border border-neutral-700 resize-none"
          value={notes}
          onChange={e => saveNotes(e.target.value)}
        />
      </div>
    </div>
  )
}

export default function BackRoad(){
  const [posts, setPosts] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [liked, setLiked] = useState(new Set())

  useEffect(() => {
    fetch('/api/backroad/feed').then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {})
  }, [])

  const submit = async () => {
    if(!title && !body) return
    const r = await fetch('/api/backroad/post', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, body })
    })
    const j = await r.json().catch(() => null)
    if(j?.post){
      setPosts(p => [j.post, ...p])
      setTitle('')
      setBody('')
    }
  }

  const toggleLike = async id => {
    const isLiked = liked.has(id)
    const delta = isLiked ? -1 : 1
    setLiked(prev => {
      const s = new Set(prev)
      if(isLiked) s.delete(id); else s.add(id)
      return s
    })
    setPosts(p => p.map(post => post.id === id ? { ...post, likes: post.likes + delta } : post))
    await fetch(`/api/backroad/like/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ delta })
    }).catch(() => {})
  }

  return (
    <div className="grid md:grid-cols-[1fr_260px] gap-4">
      <div className="space-y-4">
        <div className="card p-4 space-y-2">
          <input
            className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
          />
          <textarea
            className="w-full h-24 p-2 rounded bg-neutral-900 border border-neutral-700 resize-none"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share something..."
          />
          <div className="text-right">
            <button className="btn" onClick={submit}>Post</button>
          </div>
        </div>

        <div className="space-y-4">
          {posts.map(p => (
            <div key={p.id} className="card p-4">
              <div className="text-sm text-neutral-400">{p.author} • {new Date(p.time).toLocaleString()}</div>
              <div className="mt-2 whitespace-pre-line">{p.content}</div>
              <button
                onClick={() => toggleLike(p.id)}
                className={`mt-3 text-sm ${liked.has(p.id) ? 'text-[var(--accent)]' : 'text-[var(--accent-2)]'}`}
              >
                {liked.has(p.id) ? 'Unlike' : 'Like'} ({p.likes})
              </button>
            </div>
          ))}
        </div>
      </div>
      <RightSidebar />
    </div>
  )
}

