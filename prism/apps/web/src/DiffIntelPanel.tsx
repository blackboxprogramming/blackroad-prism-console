import React, { useState } from 'react';

type TestPrediction = { file: string; weight: number; };
type DiffIntel = {
  path: string;
  summary: string;
  functionsChanged?: string[];
  testsPredicted: TestPrediction[];
};

type Props = { intel: DiffIntel[] };

const DiffIntelPanel: React.FC<Props> = ({ intel }) => {
  const [selected, setSelected] = useState<string[]>(intel.flatMap(i => i.testsPredicted.slice(0,5).map(t => t.file)));
  const toggle = (f: string) => setSelected(s => s.includes(f) ? s.filter(x => x!==f) : [...s, f]);
  const run = async () => {
    await fetch('/run', { method: 'POST', body: JSON.stringify({ files: selected }), headers: { 'Content-Type': 'application/json' } });
  };
  return (
    <div>
      {intel.map(d => (
        <div key={d.path}>
          <h4>{d.path}</h4>
          <div>{d.summary}</div>
          {d.functionsChanged && <div>{d.functionsChanged.join(', ')}</div>}
          <ul>
            {d.testsPredicted.map(t => (
              <li key={t.file}>
                <label>
                  <input type="checkbox" checked={selected.includes(t.file)} onChange={() => toggle(t.file)} />
                  {t.file} ({t.weight})
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button onClick={run}>Run predicted tests</button>
    </div>
  );
};

export default DiffIntelPanel;
