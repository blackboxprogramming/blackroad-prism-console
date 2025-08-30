import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import AgentStack from '../components/AgentStack';

const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:4000';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function Lucidia() {
  const [tab, setTab] = useState<'chat' | 'canvas' | 'editor' | 'terminal'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [stream, setStream] = useState(true);
  const [system, setSystem] = useState({ cpu: 0, mem: 0, gpu: 0 });
  const [wallet, setWallet] = useState({ rc: 0 });
  const [contradictions, setContradictions] = useState({ issues: 0 });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const s = io(API_BASE, { transports: ['websocket'] });
    s.on('lucidia:chat', ({ chunk }) => {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant') {
          last.text += chunk;
        }
        return next;
      });
    });
    s.on('system:update', d => setSystem(d));
    s.on('wallet:update', w => setWallet(w));
    s.on('notes:update', n => setNotes(n || ''));
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [w, c, n] = await Promise.all([
          fetch(`${API_BASE}/api/wallet`),
          fetch(`${API_BASE}/api/contradictions`),
          fetch(`${API_BASE}/api/notes`)
        ]);
        if (w.ok) setWallet((await w.json()).wallet);
        if (c.ok) setContradictions((await c.json()).contradictions);
        if (n.ok) setNotes((await n.json()).notes || '');
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/lucidia/history`);
        if (res.ok) {
          const { history } = await res.json();
          const msgs: Message[] = [];
          history.forEach((h: any) => {
            msgs.push({ role: 'user', text: h.prompt });
            msgs.push({ role: 'assistant', text: h.response });
          });
          setMessages(msgs);
        }
      } catch {}
    })();
  }, []);

  async function sendPrompt(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;
    setMessages(prev => [...prev, { role: 'user', text: prompt }, { role: 'assistant', text: '' }]);
    setInput('');
    try {
      await fetch(`${API_BASE}/api/lucidia/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
    } catch {}
  }

  async function saveNotes(v: string) {
    setNotes(v);
    try {
      await fetch(`${API_BASE}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: v })
      });
    } catch {}
  }

  return (
    <div className="min-h-screen flex text-white bg-slate-950">
      {/* Left sidebar */}
      <aside className="w-64 p-4 space-y-6 border-r border-slate-800">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <div className="w-8 h-8 rounded-lg" style={{ background: 'var(--accent)' }} />
          BlackRoad.io
        </div>
        <nav className="space-y-1">
          <NavItem text="Workspace" />
          <NavItem text="Projects" />
          <NavItem text="Agents" />
          <NavItem text="Datasets" />
          <NavItem text="Models" />
          <NavItem text="Integrations" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-4">
        <section className="col-span-8 flex flex-col">
          <header className="flex items-center gap-6 border-b border-slate-800 mb-4">
            {['chat', 'canvas', 'editor', 'terminal'].map(t => (
              <Tab key={t} label={t} active={tab === t} onClick={() => setTab(t as any)} />
            ))}
          </header>

          {tab === 'chat' && (
            <div className="flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto space-y-2">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                    <div className="inline-block rounded px-2 py-1 bg-slate-800">{m.text}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendPrompt} className="mt-2 flex">
                <input
                  className="flex-1 p-2 bg-slate-900 border border-slate-700"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask Lucidia..."
                />
                <button className="ml-2 px-4 rounded" style={{ background: 'var(--accent-2)' }}>Send</button>
              </form>
            </div>
          )}

          {tab === 'editor' && (
            <div className="flex-1 border border-slate-700 rounded bg-slate-900 p-4">Editor coming soon...</div>
          )}

          {tab === 'canvas' && (
            <div className="flex-1 border border-slate-700 rounded bg-slate-900 p-4">Canvas coming soon...</div>
          )}

          {tab === 'terminal' && (
            <div className="flex-1 border border-slate-700 rounded bg-slate-900 p-4">Terminal coming soon...</div>
          )}
        </section>

        {/* Right sidebar */}
        <section className="col-span-4">
          <AgentStack
            stream={stream}
            setStream={setStream}
            system={system}
            wallet={wallet}
            contradictions={contradictions}
            notes={notes}
            setNotes={saveNotes}
          />
        </section>
      </main>
    </div>
  );
}

function NavItem({ text }: { text: string }) {
  return (
    <div className="px-2 py-2 rounded hover:bg-slate-900 cursor-pointer">
      {text}
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 uppercase ${active ? 'border-b-2' : ''}`}
      style={active ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
    >
      {label}
    </button>
  );
}
