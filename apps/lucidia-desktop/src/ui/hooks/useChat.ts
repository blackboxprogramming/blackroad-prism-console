import { useState, useCallback } from 'react';
import { ChatMessage, ChatThread } from '@/shared/types';
import { embedText } from '@/ui/lib/vectors';

const createThread = (title: string): ChatThread => ({
  id: crypto.randomUUID(),
  title,
  systemPrompt: 'You are Lucidia, a local-first assistant.',
  temperature: 0.3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: []
});

export const useChat = () => {
  const [threads, setThreads] = useState<ChatThread[]>([createThread('New Thread')]);
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0].id);

  const addMessage = useCallback((threadId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              updatedAt: new Date().toISOString(),
              messages: [
                ...thread.messages,
                {
                  ...message,
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString()
                }
              ]
            }
          : thread
      )
    );
  }, []);

  const addMemorySnippet = useCallback((threadId: string, content: string) => {
    addMessage(threadId, { role: 'system', content, metadata: { vector: embedText(content) } });
  }, [addMessage]);

  const createNewThread = useCallback(() => {
    const thread = createThread('Untitled Thread');
    setThreads((prev) => [...prev, thread]);
    setActiveThreadId(thread.id);
  }, []);

  return {
    threads,
    activeThreadId,
    setActiveThreadId,
    addMessage,
    addMemorySnippet,
    createNewThread
  };
};
