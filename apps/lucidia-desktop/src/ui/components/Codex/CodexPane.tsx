import { useState } from 'react';
import { useCodex } from '@/ui/hooks/useCodex';
import { CodexDoc } from '@/shared/types';
import { MemoryList } from './MemoryList';
import { MemoryEditor } from './MemoryEditor';
import { MemorySearch } from './MemorySearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/Primitives/Tabs';
import { dispatchCodexInsert } from '@/ui/lib/events';

export const CodexPane = () => {
  const { memoryQuery, saveMutation, search } = useCodex();
  const [selectedDoc, setSelectedDoc] = useState<CodexDoc | null>(null);

  return (
    <div className="flex h-full flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Codex Memory</h1>
        <p className="text-sm text-slate-400">Store knowledge locally and inject it into conversations.</p>
      </header>
      <Tabs defaultValue="list" className="flex flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="list">Library</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="flex-1 overflow-y-auto">
          {memoryQuery.isLoading ? (
            <p className="text-sm text-slate-400">Loading memory…</p>
          ) : (
            <MemoryList documents={memoryQuery.data ?? []} onSelect={setSelectedDoc} />
          )}
        </TabsContent>
        <TabsContent value="search">
          <MemorySearch
            onSearch={search}
            onSendToChat={(docs) => dispatchCodexInsert({ docs: docs.map((doc) => ({ id: doc.id, content: doc.content })) })}
          />
        </TabsContent>
        <TabsContent value="editor">
          <MemoryEditor
            initial={selectedDoc}
            onSave={(payload) => {
              saveMutation.mutate(payload);
              setSelectedDoc(null);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
=====
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
>>>>>>> 3d867c2e88e43a0218ced55f75539cfc1ab8fa42
import { useState } from 'react';
<<<<<<<+HEAD
import { useCodex } from '@/ui/hooks/useCodex';
import { CodexDoc } from '@/shared/types';
import { MemoryList } from './MemoryList';
import { MemoryEditor } from './MemoryEditor';
import { MemorySearch } from './MemorySearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/Primitives/Tabs';
import { dispatchCodexInsert } from '@/ui/lib/events';

export const CodexPane = () => {
  const { memoryQuery, saveMutation, search } = useCodex();
  const [selectedDoc, setSelectedDoc] = useState<CodexDoc | null>(null);

  return (
    <div className="flex h-full flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Codex Memory</h1>
        <p className="text-sm text-slate-400">Store knowledge locally and inject it into conversations.</p>
      </header>
      <Tabs defaultValue="list" className="flex flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="list">Library</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="flex-1 overflow-y-auto">
          {memoryQuery.isLoading ? (
            <p className="text-sm text-slate-400">Loading memory…</p>
          ) : (
            <MemoryList documents={memoryQuery.data ?? []} onSelect={setSelectedDoc} />
          )}
        </TabsContent>
        <TabsContent value="search">
          <MemorySearch
            onSearch={search}
            onSendToChat={(docs) => dispatchCodexInsert({ docs: docs.map((doc) => ({ id: doc.id, content: doc.content })) })}
          />
        </TabsContent>
        <TabsContent value="editor">
          <MemoryEditor
            initial={selectedDoc}
            onSave={(payload) => {
              saveMutation.mutate(payload);
              setSelectedDoc(null);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
=====
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
>>>>>>> 3d867c2e88e43a0218ced55f75539cfc1ab8fa42
