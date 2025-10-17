import React, { useEffect, useState } from 'react';

interface Client {
  run(cmd: string): Promise<{ runId: string }>;
  cancelRun(id: string): Promise<void>;
}

const Console: React.FC<{ client: Client }> = ({ client }) => {
  const [cmd, setCmd] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!runId) return;
    const es = new EventSource('/events');
    const extract = (message: MessageEvent): any => {
      const parsed = JSON.parse(message.data);
      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        return (parsed as any).data;
      }
      return parsed;
    };
    es.addEventListener('run.out', (e) => {
      const data = extract(e as MessageEvent);
      if (data.runId === runId) setLines((l) => [...l, data.chunk]);
    });
    es.addEventListener('run.err', (e) => {
      const data = extract(e as MessageEvent);
      if (data.runId === runId) setLines((l) => [...l, data.chunk]);
    });
    es.addEventListener('run.end', (e) => {
      const data = extract(e as MessageEvent);
      if (data.runId === runId) {
        setStatus(data.exitCode === 0 ? 'ok' : data.exitCode === null ? 'cancelled' : 'error');
        es.close();
      }
    });
    setStatus('running');
    return () => es.close();
  }, [runId]);

  const start = async () => {
    const res = await client.run(cmd);
    setLines([]);
    setRunId(res.runId);
  };

  const stop = async () => {
    if (runId) await client.cancelRun(runId);
  };

  return (
    <div>
      <input value={cmd} onChange={(e) => setCmd(e.target.value)} />
      <button onClick={start}>Run</button>
      <button onClick={stop}>Stop</button>
      <pre>{lines.join('')}</pre>
      <div>{status}</div>
    </div>
  );
};

export default Console;
