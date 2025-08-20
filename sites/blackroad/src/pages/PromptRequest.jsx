import { useState } from 'react'

export default function PromptRequest() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')

  async function submit(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      })
      setStatus(res.ok ? 'Request sent!' : 'Request failed')
      if (res.ok) setText('')
    } catch {
      setStatus('Request failed')
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Request a Code Prompt</h2>
      <form onSubmit={submit} className="space-y-2">
        <textarea
          className="w-full p-2 rounded bg-white/5 border border-white/10"
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the code you need..."
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700"
        >
          Send
        </button>
      </form>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  )
}
