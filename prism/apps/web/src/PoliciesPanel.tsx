import React, { useEffect, useState } from 'react';

const PoliciesPanel: React.FC = () => {
  const [mode, setMode] = useState('dev');
  useEffect(() => { fetch('/mode').then(r => r.json()).then(d => setMode(d.currentMode)); }, []);
  const change = async (m: string) => {
    await fetch('/mode', { method: 'PUT', body: JSON.stringify({ mode: m }), headers: { 'Content-Type': 'application/json' } });
    setMode(m);
  };
  return (
    <select value={mode} onChange={e => change(e.target.value)}>
      <option value="playground">Playground</option>
      <option value="dev">Dev</option>
      <option value="trusted">Trusted</option>
      <option value="prod">Prod</option>
    </select>
  );
};

export default PoliciesPanel;
