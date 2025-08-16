import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { telemetryInit } from '../lib/telemetry.ts'

export default function Layout({ children }) {
  useEffect(() => { telemetryInit() }, [])
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <header className="py-8">
          <h1 className="text-4xl font-bold">blackroad.io</h1>
          <p className="opacity-80 mt-2">Fast lane to shipping. Flag-aware, bot-powered workflows.</p>
        </header>
        {children || <Outlet />}
        <footer className="opacity-70 mt-16">© {new Date().getFullYear()} blackroad</footer>
      </div>
    </main>
  )
}
