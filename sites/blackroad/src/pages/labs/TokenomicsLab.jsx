import { useCallback, useMemo, useState } from 'react';
import ActiveReflection from '../ActiveReflection.jsx';
import EvidencePreview from '../../components/EvidencePreview.jsx';

const DEFAULT_SCENARIO = {
  kind: 'linear',
  startDate: '2025-01-01',
  horizonMonths: 12,
  params: {
    initialSupply: 1000000,
    emissionPerMonth: 25000,
    maxSupply: 1500000
  }
};

const PROMPTS = [
  'Which assumption most drives inflation in this scenario?',
  'Where did invariants almost fail?',
  'What governance controls are required to approve this run?'
];

async function graphqlRequest(query, variables) {
  const endpoint = process.env.NEXT_PUBLIC_ECONOMY_GATEWAY_URL ?? '/api/economy/graphql';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!response.ok) {
    throw new Error(`Gateway responded with ${response.status}`);
  }
  const payload = await response.json();
  if (payload.errors) {
    throw new Error(payload.errors.map((error) => error.message).join(', '));
  }
  return payload.data;
}

export default function TokenomicsLab() {
  const [scenarioJson, setScenarioJson] = useState(JSON.stringify(DEFAULT_SCENARIO, null, 2));
  const [seed, setSeed] = useState(7);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [summary, setSummary] = useState(null);

  const appendLog = useCallback((entry) => {
    setLogs((current) => [...current, `[${new Date().toLocaleTimeString()}] ${entry}`]);
  }, []);

  const handleRun = useCallback(async () => {
    let parsedScenario;
    try {
      parsedScenario = JSON.parse(scenarioJson);
    } catch (error) {
      appendLog(`❌ Scenario JSON invalid: ${error.message}`);
      return;
    }

    setRunning(true);
    setEvidence('');
    setSummary(null);
    setLogs([]);

    try {
      appendLog('Creating simulation...');
      const created = await graphqlRequest(
        `mutation($scenario: ScenarioInput!, $seed: Int) {
          simulationCreate(scenario: $scenario, seed: $seed) { id }
        }`,
        { scenario: parsedScenario, seed }
      );

      const id = created.simulationCreate.id;
      appendLog(`Simulation ${id} created, starting run...`);

      await graphqlRequest(
        `mutation($id: ID!) { simulationRun(id: $id) { id } }`,
        { id }
      );

      let status = 'CREATED';
      while (status !== 'COMPLETED' && status !== 'FAILED') {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const result = await graphqlRequest(
          `query($id: ID!) {
            simulation(id: $id) {
              id
              status
              summary { finalSupply maxInflation breaches }
              artifacts { kind url }
              evidenceHash
            }
          }`,
          { id }
        );
        const simulation = result.simulation;
        if (!simulation) {
          throw new Error('Simulation vanished during polling');
        }
        if (simulation.status !== status) {
          status = simulation.status;
          appendLog(`Status → ${status}`);
        }
        if (status === 'COMPLETED') {
          setSummary(simulation.summary);
          appendLog(`Evidence hash ${simulation.evidenceHash ?? 'n/a'}`);
          const evidenceArtifact = simulation.artifacts.find((artifact) => artifact.kind === 'evidence');
          if (evidenceArtifact && evidenceArtifact.url.startsWith('http')) {
            try {
              const res = await fetch(evidenceArtifact.url);
              if (res.ok) {
                setEvidence(await res.text());
              }
            } catch (fetchError) {
              appendLog(`⚠️ failed to fetch evidence: ${fetchError.message}`);
            }
          }
        }
      }
    } catch (error) {
      appendLog(`❌ ${error.message}`);
    } finally {
      setRunning(false);
    }
  }, [scenarioJson, seed, appendLog]);

  const scenarioPreview = useMemo(() => scenarioJson, [scenarioJson]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Tokenomics Lab</h1>
        <p className="text-sm text-slate-400 max-w-3xl mt-2">
          Craft RoadCoin style emission scenarios, run deterministic simulations, and review evidence artifacts before shipping to governance.
        </p>
      </header>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Scenario</h2>
          <textarea
            value={scenarioPreview}
            onChange={(event) => setScenarioJson(event.target.value)}
            className="w-full h-64 bg-slate-900 border border-slate-700 rounded-md p-4 font-mono text-xs"
          />
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">
              Seed
              <input
                type="number"
                className="ml-2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                value={seed}
                onChange={(event) => setSeed(parseInt(event.target.value, 10) || 0)}
              />
            </label>
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="px-4 py-2 bg-emerald-500/80 hover:bg-emerald-400 text-slate-950 font-medium rounded-md disabled:opacity-50"
            >
              {running ? 'Running…' : 'Run Simulation'}
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-md p-4 h-48 overflow-auto">
            <ul className="space-y-1 text-xs font-mono text-emerald-100">
              {logs.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          {summary && (
            <div className="border border-emerald-500/40 rounded-md p-4 bg-slate-900/80 text-sm">
              <p>Final supply: {summary.finalSupply.toFixed(2)}</p>
              <p>Max inflation: {summary.maxInflation.toFixed(4)}%</p>
              <p>Breaches: {summary.breaches.length ? summary.breaches.join(', ') : 'None'}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Evidence</h2>
          <EvidencePreview evidence={evidence} />
          <ActiveReflection title="Active Reflection" storageKey="tokenomics-lab" prompts={PROMPTS} />
        </div>
      </section>
    </div>
  );
}
