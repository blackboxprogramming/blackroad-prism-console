'use client';

import { brLog } from './brLog';
import { redactHeaders, redactSnapshot, truncate } from './redact';

type FetchOptions = RequestInit & {
  label?: string;
  enabled?: boolean;
  maxBodyLength?: number;
};

const ENV_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_PROBES === 'true' || process.env.NODE_ENV !== 'production';

function normalizeHeaders(headers?: HeadersInit) {
  if (!headers) return {};
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...(headers as Record<string, string>) };
}

function coerceBody(body: BodyInit | null | undefined, max = 1024) {
  if (!body) return undefined;
  if (typeof body === 'string') return truncate(body, max);
  if (body instanceof Blob) {
    return `[blob ${body.type || 'application/octet-stream'} ${body.size}b]`;
  }
  if (body instanceof FormData) {
    const entries: Record<string, string> = {};
    body.forEach((value, key) => {
      entries[key] = typeof value === 'string' ? value : `[file ${value.name || 'unnamed'}]`;
    });
    return redactSnapshot(entries);
  }
  if (body instanceof URLSearchParams) {
    return truncate(body.toString(), max);
  }
  if (typeof body === 'object') {
    return redactSnapshot(body);
  }
  return '[unserializable-body]';
}

export async function brFetch(input: RequestInfo, init?: FetchOptions) {
  const options = init ?? {};
  const enabled = options.enabled ?? ENV_ENABLED;
  if (!enabled) {
    return fetch(input, options);
  }

  const label = options.label || 'fetch';
  const started = performance.now();
  const method = (options.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
  const url = typeof input === 'string' ? input : 'url' in input ? input.url : String(input);
  const headers = normalizeHeaders(options.headers);

  brLog('fetch:request', {
    label,
    url,
    method,
    headers: redactHeaders(headers),
    body: coerceBody(options.body, options.maxBodyLength ?? 1024),
  }, 'debug');

  try {
    const response = await fetch(input, options);
    let preview: string | undefined;
    try {
      const clone = response.clone();
      const text = await clone.text();
      preview = truncate(text, options.maxBodyLength ?? 2048);
    } catch (error) {
      preview = `[body unavailable: ${error instanceof Error ? error.message : String(error)}]`;
    }

    brLog(
      'fetch:response',
      {
        label,
        url,
        status: response.status,
        ok: response.ok,
        durationMs: Number((performance.now() - started).toFixed(2)),
        headers: redactHeaders(response.headers),
        body: preview,
      },
      response.ok ? 'info' : 'warn'
    );

    return response;
  } catch (error) {
    brLog(
      'fetch:error',
      {
        label,
        url,
        method,
        durationMs: Number((performance.now() - started).toFixed(2)),
        error: error instanceof Error ? error.message : String(error),
      },
      'error'
    );
    throw error;
  }
}
