'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSession, setCurrentSession } from '../../lib/sessionEngine';

export default function RoadWorkPage() {
  const [name, setName] = useState('');
  const router = useRouter();

  function create() {
    if (!name.trim()) return;
    saveSession(name, { chat: [], files: [], assets: [] });
    setCurrentSession(name);
    router.push('/portal');
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-bold">New Project</h1>
      <input
        className="w-full rounded border px-3 py-2"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Project name"
      />
      <button onClick={create} className="rounded border px-3 py-2">
        Create
      </button>
    </main>
  );
}

