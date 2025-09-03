'use client';

import { useState } from 'react';

export interface File {
  name: string;
  content: string;
  type: 'code' | 'image' | 'text' | 'json';
}

export interface Session {
  id: string;
  title: string;
  agent: string;
  messages: Message[];
  files: File[];
  createdAt: number;
}

export interface Message {
  role: 'user' | 'agent';
  content: string;
  ability?: string;
  timestamp: number;
}

export const useSessionManager = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const createSession = (agent = 'lucidia') => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: `Untitled Session`,
      agent,
      messages: [],
      files: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  };

  const addMessage = (sessionId: string, message: Message) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
      )
    );
  };

  const addFile = (sessionId: string, file: File) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId ? { ...s, files: [...s.files, file] } : s
      )
    );
  };

  const getActiveSession = () =>
    sessions.find(s => s.id === activeSessionId) ?? null;

  return {
    sessions,
    createSession,
    addMessage,
    addFile,
    getActiveSession,
    setActiveSessionId,
  };
};

