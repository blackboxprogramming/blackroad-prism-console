import { useState } from 'react';
import { useCodex } from '../../hooks/useCodex';
import { Button } from '../Primitives/Button';
import { MemoryList } from './MemoryList';
import { MemoryEditor } from './MemoryEditor';
import { MemorySearch } from './MemorySearch';

export function CodexPane() {
  const { docs, addDoc, search } = useCodex();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = query ? search(query) : docs;
  const selected = docs.find((doc) => doc.id === selectedId) ?? null;

  return (
    <div className="codex-pane">
      <div className="codex-sidebar">
        <Button onClick={() => setSelectedId(addDoc({ title: 'Untitled', tags: [], content: '' }).id)}>
          New Memory
        </Button>
        <MemorySearch value={query} onChange={setQuery} />
        <MemoryList docs={filtered} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <div className="codex-editor">
        {selected ? (
          <MemoryEditor doc={selected} />
        ) : (
          <p>Select a memory to edit or create a new one.</p>
        )}
      </div>
    </div>
  );
}
