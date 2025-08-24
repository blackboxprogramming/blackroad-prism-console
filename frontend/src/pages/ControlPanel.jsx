import React, { useState } from 'react'
import {
  restartService,
  rollbackLatest,
  rollbackTo,
  purgeContradictions,
  injectContradictionTest
} from '../api'

export default function ControlPanel(){
  const [status, setStatus] = useState('idle')

  async function run(action){
    if(!confirm('Are you sure?')) return
    setStatus('pending')
    try{
      await action()
      setStatus('done')
      alert('Success')
    }catch(e){
      setStatus('failed')
      alert('Failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>Status: {status}</div>
      <section>
        <h2 className="text-xl font-semibold mb-2">Services</h2>
        <div className="flex flex-wrap gap-2">
          <button className="badge" onClick={()=>run(()=>restartService('api'))}>Restart API</button>
          <button className="badge" onClick={()=>run(()=>restartService('llm'))}>Restart LLM</button>
          <button className="badge" onClick={()=>run(()=>restartService('math'))}>Restart Math</button>
          <button className="badge" onClick={()=>run(()=>restartService('frontend'))}>Restart Frontend</button>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Rollback</h2>
        <div className="flex flex-wrap gap-2">
          <button className="badge" onClick={()=>run(rollbackLatest)}>Force Latest Snapshot</button>
          <button className="badge" onClick={()=>{
            const id = prompt('Snapshot ID?')
            if(id) run(()=>rollbackTo(id))
          }}>Rollback to ID</button>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Contradictions</h2>
        <div className="flex flex-wrap gap-2">
          <button className="badge" onClick={()=>run(purgeContradictions)}>Purge Contradictions</button>
          <button className="badge" onClick={()=>run(injectContradictionTest)}>Inject Test</button>
        </div>
      </section>
    </div>
  )
}
