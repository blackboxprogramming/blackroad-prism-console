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
