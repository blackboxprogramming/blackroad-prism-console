import React, { useState } from 'react';

export default function MciWorkbench() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState(null);

  async function run() {
    const res = await fetch('/api/mci/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expr, mode: 'both' })
    });
    const json = await res.json();
    setResult(json);
  }

  return (
    <div className="mci-workbench">
      <h2>Math×Code Workbench</h2>
      <textarea value={expr} onChange={e => setExpr(e.target.value)} />
      <button onClick={run}>Run</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
