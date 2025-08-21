import { useState } from 'react'
import { t } from '../lib/i18n.ts'

export default function Portal(){
  const [code, setCode] = useState('console.log("Hello, BlackRoad")')
  const [output, setOutput] = useState('')

  const runCode = () => {
    try {
      const logs = []
      const originalLog = console.log
      console.log = (...args) => logs.push(args.join(' '))
      const result = eval(code)
      console.log = originalLog
      if (result !== undefined) logs.push(String(result))
      setOutput(logs.join('\n'))
    } catch (err) {
      setOutput(String(err))
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navPortal')}</h2>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        className="w-full h-40 font-mono p-2 border rounded"
      />
      <button onClick={runCode} className="btn mt-2">Run</button>
      <pre className="mt-2 p-2 bg-black text-white rounded h-40 overflow-auto">{output}</pre>
    </div>
  )
}

