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
import { useCallback } from 'react';
import { useChatStore } from '../lib/store';

export function useChat() {
  const threads = useChatStore((state) => state.threads);
  const activeThreadId = useChatStore((state) => state.activeThreadId);
  const createThread = useChatStore((state) => state.createThread);
  const postMessage = useChatStore((state) => state.postMessage);
  const setActiveThread = useChatStore((state) => state.setActiveThread);

  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeThread) {
        return;
      }
      postMessage(activeThread.id, 'user', content);
    },
    [activeThread, postMessage]
  );

  return {
    threads,
    activeThread,
    activeThreadId,
    createThread,
    postMessage,
    setActiveThread,
    sendMessage
  };
}
