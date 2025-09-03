'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listSessions, setCurrentSession, SessionData } from '../../lib/sessionEngine';

export default function RoadViewPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const router = useRouter();

  useEffect(() => {
    setSessions(listSessions());
  }, []);

  function load(name: string) {
    setCurrentSession(name);
    router.push('/chat');
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Saved Sessions</h1>
      {sessions.length === 0 && (
        <p className="text-sm text-gray-400">No sessions saved yet.</p>
      )}
      <ul className="space-y-2">
        {sessions.map(s => (
          <li key={s.name} className="flex items-center justify-between border p-3 rounded">
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-gray-400">{new Date(s.timestamp).toLocaleString()}</div>
            </div>
            <button onClick={() => load(s.name)} className="border rounded px-3 py-1">Load</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
