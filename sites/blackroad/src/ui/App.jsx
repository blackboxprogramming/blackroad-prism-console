import { useEffect } from 'react'
import { telemetryInit } from '../lib/telemetry.ts'
import Status from './Status.jsx'
import Snapshot from './Snapshot.jsx'

export default function App() {
  useEffect(() => { telemetryInit() }, [])
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <header className="py-8">
          <h1 className="text-4xl font-bold">blackroad.io</h1>
          <p className="opacity-80 mt-2">Fast lane to shipping. Flag-aware, bot-powered workflows.</p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <Card title="Quick Commands">
            <ul className="list-disc ml-5">
              <li><code>/deploy blackroad pages</code>, <code>vercel</code>, or <code>cloudflare</code></li>
              <li><code>/toggle ai off</code> / <code>/toggle security off</code></li>
              <li><code>/fix</code>, <code>/lint</code>, <code>/bump deps</code>, <code>/release</code></li>
            </ul>
          </Card>
          <Status />
          <Snapshot />
        </section>

        <footer className="opacity-70 mt-16">© {new Date().getFullYear()} blackroad</footer>
      </div>
    </main>
  )
}
function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </div>
  )
}
