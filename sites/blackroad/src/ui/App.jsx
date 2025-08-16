import { useEffect } from 'react'
import { telemetryInit } from '../lib/telemetry.ts'

export default function App() {
  useEffect(() => {
    telemetryInit()
  }, [])
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <header className="py-8">
          <h1 className="text-4xl font-bold">blackroad.io</h1>
          <p className="opacity-80 mt-2">Fast lane to shipping. Flag-aware, bot-powered workflows.</p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <Card title="Docs">
            <ul className="list-disc ml-5">
              <li>Use <code>/toggle ai off</code> to disable AI helpers</li>
              <li>Use <code>/toggle security off</code> to skip security scans</li>
              <li>Run <code>/deploy blackroad</code> to publish</li>
            </ul>
          </Card>
          <Card title="Status">
            <p>Everything is skip-safe. If a tool is missing, the workflow skips instead of failing.</p>
          </Card>
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
