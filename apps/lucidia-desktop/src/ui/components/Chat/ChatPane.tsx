import { useHotkeys } from 'react-hotkeys-hook';
import { useEffect, useState } from 'react';
import { useChat } from '@/ui/hooks/useChat';
import { ThreadList } from './ThreadList';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { CommandPalette } from './CommandPalette';
import { CODEX_INSERT_EVENT, CodexInsertDetail } from '@/ui/lib/events';

export const ChatPane = () => {
  const { threads, activeThreadId, setActiveThreadId, addMessage, addMemorySnippet, createNewThread } = useChat();
  const [isPaletteOpen, setPaletteOpen] = useState(false);

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? threads[0];

  useHotkeys('mod+k', () => setPaletteOpen(true));

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<CodexInsertDetail>).detail;
      detail?.docs.forEach((doc) => addMemorySnippet(activeThread.id, doc.content));
    };
    window.addEventListener(CODEX_INSERT_EVENT, handler as EventListener);
    return () => window.removeEventListener(CODEX_INSERT_EVENT, handler as EventListener);
  }, [activeThread.id, addMemorySnippet]);

  const handleCommand = (command: string) => {
    if (command.startsWith('/memory add')) {
      addMemorySnippet(activeThread.id, command.replace('/memory add', '').trim());
    }
    // Additional slash commands can be handled here.
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <ThreadList threads={threads} activeThreadId={activeThread.id} onSelect={setActiveThreadId} onNew={createNewThread} />
      <section className="flex-1 overflow-y-auto rounded-lg border border-slate-700 bg-surface-muted p-4">
        <MessageList messages={activeThread.messages} />
        <Composer onSubmit={(content) => addMessage(activeThread.id, { role: 'user', content })} />
      </section>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setPaletteOpen(false)} onCommand={handleCommand} />
    </div>
  );
};
