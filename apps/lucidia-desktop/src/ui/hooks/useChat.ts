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
