'use client';

import { redactSnapshot } from './redact';

export type BrLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface BrLogEntry {
  id: string;
  level: BrLogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

type Listener = (entry: BrLogEntry) => void;

const listeners = new Set<Listener>();
const history: BrLogEntry[] = [];
const HISTORY_LIMIT = 200;

function emit(entry: BrLogEntry) {
  history.push(entry);
  if (history.length > HISTORY_LIMIT) {
    history.splice(0, history.length - HISTORY_LIMIT);
  }

  if (typeof window !== 'undefined') {
    if (!Array.isArray(window.__BR_LOG_HISTORY__)) {
      window.__BR_LOG_HISTORY__ = [];
    }
    window.__BR_LOG_HISTORY__.push(entry);
    if (window.__BR_LOG_HISTORY__.length > HISTORY_LIMIT) {
      window.__BR_LOG_HISTORY__.shift();
    }
  }

  for (const listener of listeners) {
    try {
      listener(entry);
    } catch (err) {
      console.error('[brLog] listener error', err);
    }
  }
}

export function brLog(
  message: string,
  data?: unknown,
  level: BrLogLevel = 'info'
) {
  const entry: BrLogEntry = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2),
    level,
    message,
    data: data == null ? undefined : redactSnapshot(data),
    timestamp: new Date().toISOString(),
  };

  switch (level) {
    case 'error':
      console.error('[brLog]', message, entry.data);
      break;
    case 'warn':
      console.warn('[brLog]', message, entry.data);
      break;
    case 'debug':
      console.debug('[brLog]', message, entry.data);
      break;
    default:
      console.info('[brLog]', message, entry.data);
  }

  emit(entry);
}

export function subscribeToBrLog(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBrLogHistory() {
  if (typeof window !== 'undefined' && Array.isArray(window.__BR_LOG_HISTORY__)) {
    return [...window.__BR_LOG_HISTORY__];
  }
  return [...history];
}

declare global {
  interface Window {
    __BR_LOG_HISTORY__?: BrLogEntry[];
  }
}
