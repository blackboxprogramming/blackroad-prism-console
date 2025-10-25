'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addHours, addMinutes } from 'date-fns';
import { apiClient } from '@/lib/api';
import { defaultDelayMs, toIsoString } from '@/lib/time';
import { evaluatePostSafety } from '@/lib/safety';
import { useRateLimiter } from '@/hooks/use-rate-limiter';
import type { Post } from '@/lib/types';

interface ComposeOptions {
  threadId?: string;
  roomId?: string;
}

interface ComposeState {
  markdown: string;
  delayMs: number;
  scheduledAt: string;
  warnings: ReturnType<typeof evaluatePostSafety>;
  updateMarkdown: (value: string) => void;
  updateDelay: (ms: number) => void;
  submit: () => Promise<Post | undefined>;
  isSubmitting: boolean;
  reset: () => void;
  canSubmit: boolean;
  error?: string;
}

export function useCompose({ threadId, roomId }: ComposeOptions): ComposeState {
  const key = useMemo(() => {
    const scope = threadId ? `thread:${threadId}` : roomId ? `room:${roomId}` : 'standalone';
    return `backroad:draft:${scope}`;
  }, [threadId, roomId]);

  const rateLimiter = useRateLimiter();

  const [markdown, setMarkdown] = useState('');
  const [delayMs, setDelayMs] = useState(defaultDelayMs);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as { markdown: string; delayMs: number };
      setMarkdown(parsed.markdown);
      setDelayMs(parsed.delayMs);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify({ markdown, delayMs }));
  }, [key, markdown, delayMs]);

  const scheduledAt = useMemo(() => toIsoString(Date.now() + delayMs), [delayMs]);
  const warnings = useMemo(() => evaluatePostSafety(markdown), [markdown]);

  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!rateLimiter.canQueuePost()) {
        setError('Rate limit reached: one queued post per minute.');
        return undefined;
      }
      setError(undefined);
      const body = {
        markdown,
        visibleAt: scheduledAt,
        delayMs,
        ...(threadId || roomId ? {} : { title: deriveTitle(markdown) }),
      };
      const path = threadId
        ? `/api/threads/${threadId}/posts`
        : roomId
        ? `/api/rooms/${roomId}/posts`
        : '/api/threads';
      const response = await apiClient.post<Post | object>(path, body);
      await client.invalidateQueries({ queryKey: ['threads'] });
      if (threadId) {
        await client.invalidateQueries({ queryKey: ['thread', threadId] });
      }
      if (roomId) {
        await client.invalidateQueries({ queryKey: ['room', roomId] });
      }
      rateLimiter.trackQueuedPost();
      return threadId || roomId ? (response as Post) : undefined;
    },
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setMarkdown('');
      setDelayMs(defaultDelayMs);
    },
  });

  const updateMarkdown = useCallback((value: string) => {
    setMarkdown(value);
  }, []);

  const updateDelay = useCallback((ms: number) => {
    setDelayMs(ms);
  }, []);

  const reset = useCallback(() => {
    setMarkdown('');
    setDelayMs(defaultDelayMs);
    setError(undefined);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  }, [key]);

  const canSubmit = Boolean(markdown.trim()) && !mutation.isPending && rateLimiter.canDraft();

  return {
    markdown,
    delayMs,
    scheduledAt,
    warnings,
    updateMarkdown,
    updateDelay,
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    reset,
    canSubmit,
    error,
  };
}

export const delayOptions = [
  { label: '30 minutes', value: addMinutes(new Date(0), 30).getTime() - new Date(0).getTime() },
  { label: '1 hour', value: addHours(new Date(0), 1).getTime() - new Date(0).getTime() },
  { label: '3 hours', value: defaultDelayMs },
  { label: '6 hours', value: addHours(new Date(0), 6).getTime() - new Date(0).getTime() },
  { label: '12 hours', value: addHours(new Date(0), 12).getTime() - new Date(0).getTime() },
  { label: '24 hours', value: addHours(new Date(0), 24).getTime() - new Date(0).getTime() },
];

function deriveTitle(markdown: string): string {
  const line = markdown.split('\n').find((item) => item.trim().length > 0);
  return line ? line.trim().slice(0, 80) : 'New Thread';
}
