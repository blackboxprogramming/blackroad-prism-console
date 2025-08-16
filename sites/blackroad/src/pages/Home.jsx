import { useEffect } from 'react'
import { logToWorker } from '../lib/logger.ts'
import { recordConversion } from '../lib/convert.ts'

export default function Home(){
  useEffect(()=>{
    const url = import.meta.env.VITE_LOG_WRITE_URL // worker /log endpoint
    if (url) logToWorker(url, 'info', 'home_view', { hint: 'home page mounted' })
  },[])
  return (
    <div className="card">
      <h1 className="text-2xl font-bold mb-2">BlackRoad</h1>
      <p>Welcome. Explore MathLab, Metrics, Logs, and the Agent Inbox.</p>
      <button className="btn mt-4" onClick={()=> recordConversion('cta_click', 1, { where: 'home.hero' })}>
        Demo: Record Conversion (cta_click)
      </button>
      <p className="text-xs opacity-70 mt-2">Set <code>VITE_ANALYTICS_BASE</code> to your worker base URL (e.g. https://<name>.workers.dev).</p>
    </div>
  )
}
