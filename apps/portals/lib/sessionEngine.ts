export interface SessionData {
  name: string;
  chat: any[];
  files: any[];
  assets: any[];
  timestamp: number;
}

const STORAGE_KEY = 'portalSessions';
const CURRENT_KEY = 'currentPortalSession';

export function saveSession(name: string, data: { chat: any[]; files: any[]; assets: any[] }) {
  if (typeof window === 'undefined') return;
  const sessions: SessionData[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const idx = sessions.findIndex(s => s.name === name);
  const session: SessionData = { name, timestamp: Date.now(), ...data };
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function listSessions(): SessionData[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function loadSession(name: string): SessionData | null {
  const sessions = listSessions();
  return sessions.find(s => s.name === name) || null;
}

export function setCurrentSession(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_KEY, name);
}

export function getCurrentSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  const name = localStorage.getItem(CURRENT_KEY);
  if (!name) return null;
  return loadSession(name);
}
