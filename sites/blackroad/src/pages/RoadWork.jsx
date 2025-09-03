import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TYPES = ['code', 'image', 'game', 'story', 'tool'];
const AGENTS = ['Lucidia', 'Silas', 'Aria', 'Nova'];

function StepModal({ show, children }) {
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
        show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`bg-neutral-900 p-6 rounded-xl shadow-xl transform transition-transform duration-300 ${
          show ? 'scale-100' : 'scale-95'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function RoadWork() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [agent, setAgent] = useState('');
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (generating) {
      const t = setTimeout(() => {
        navigate('/roadview');
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [generating, navigate]);

  return (
    <div className="relative">
      <StepModal show={step === 0}>
        <h2 className="text-xl font-semibold mb-2">Name your project</h2>
        <input
          className="input w-full mb-4"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" disabled={!name.trim()} onClick={() => setStep(1)}>
          Next
        </button>
      </StepModal>

      <StepModal show={step === 1}>
        <h2 className="text-xl font-semibold mb-2">Choose type</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {TYPES.map((t) => (
            <button
              key={t}
              className={`btn ${type === t ? '' : 'opacity-60'}`}
              onClick={() => setType(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn" disabled={!type} onClick={() => setStep(2)}>
          Next
        </button>
      </StepModal>

      <StepModal show={step === 2}>
        <h2 className="text-xl font-semibold mb-2">Select lead agent</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {AGENTS.map((a) => (
            <button
              key={a}
              className={`btn ${agent === a ? '' : 'opacity-60'}`}
              onClick={() => setAgent(a)}
            >
              {a}
            </button>
          ))}
        </div>
        <button className="btn" disabled={!agent} onClick={() => setStep(3)}>
          Next
        </button>
      </StepModal>

      <StepModal show={step === 3}>
        <h2 className="text-xl font-semibold mb-4">Generate starter files</h2>
        {generating ? (
          <div className="animate-pulse text-center">Preparing {name}...</div>
        ) : (
          <button className="btn" onClick={() => setGenerating(true)}>
            Generate
          </button>
        )}
      </StepModal>
    </div>
  );
}

