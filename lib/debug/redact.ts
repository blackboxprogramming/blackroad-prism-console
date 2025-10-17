'use client';

const SECRET_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'set-cookie',
  'apikey',
  'api-key',
  'client-secret',
  'session',
  'signature',
  'bearer',
];

export type RedactOptions = {
  maxDepth?: number;
  maxStringLength?: number;
};

export function shouldRedact(key?: string) {
  const value = (key || '').toLowerCase();
  return SECRET_KEYS.some((secret) => value.includes(secret));
}

export function truncate(value: string, max = 512) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function redactInternal(value: unknown, depth: number, options: Required<RedactOptions>) {
  if (value == null) return value;
  if (depth >= options.maxDepth) return '[Truncated]';

  if (Array.isArray(value)) {
    return value.map((item) => redactInternal(item, depth + 1, options));
  }

  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      output[key] = shouldRedact(key)
        ? '[REDACTED]'
        : redactInternal(v, depth + 1, options);
    }
    return output;
  }

  if (typeof value === 'string') {
    return truncate(value, options.maxStringLength);
  }

  return value;
}

export function redactSnapshot(value: unknown, options: RedactOptions = {}) {
  return redactInternal(value, 0, {
    maxDepth: options.maxDepth ?? 4,
    maxStringLength: options.maxStringLength ?? 512,
  });
}

export function redactHeaders(input?: HeadersInit | Record<string, unknown>) {
  if (!input) return {};
  let headers: Record<string, unknown> = {};
  if (typeof Headers !== 'undefined' && input instanceof Headers) {
    headers = Object.fromEntries(input.entries());
  } else if (Array.isArray(input)) {
    headers = Object.fromEntries(input);
  } else if (isPlainObject(input)) {
    headers = { ...input };
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    sanitized[key] = shouldRedact(key) ? '[REDACTED]' : String(value);
  }
  return sanitized;
}
