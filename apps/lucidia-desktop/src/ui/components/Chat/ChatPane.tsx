import { useChat } from '../../hooks/useChat';
import { Button } from '../Primitives/Button';
import { ThreadList } from './ThreadList';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { CommandPalette } from './CommandPalette';
import { useState } from 'react';

export function ChatPane() {
  const { threads, activeThread, createThread, setActiveThread, sendMessage, postMessage } = useChat();
  const [isPaletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="chat-pane">
      <aside className="chat-sidebar">
        <Button onClick={() => createThread('New Thread')}>New Thread</Button>
        <ThreadList threads={threads} activeThreadId={activeThread?.id} onSelect={setActiveThread} />
      </aside>
      <section className="chat-main">
        <header className="chat-header">
          <h2>{activeThread?.title ?? 'Select or create a thread'}</h2>
          <Button variant="secondary" onClick={() => setPaletteOpen(true)}>
            Command Palette (Ctrl/Cmd+K)
          </Button>
        </header>
        <MessageList messages={activeThread?.messages ?? []} />
        <Composer
          disabled={!activeThread}
          onSubmit={(value) => {
            if (!activeThread) return;
            sendMessage(value);
            postMessage(activeThread.id, 'assistant', 'Stub reply from local model.');
          }}
        />
      </section>
      <CommandPalette open={isPaletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
