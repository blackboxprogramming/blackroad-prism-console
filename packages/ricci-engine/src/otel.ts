export interface Span {
  name: string;
  attributes: Record<string, unknown>;
  end(): void;
  setAttribute(key: string, value: unknown): void;
}

class NoopSpan implements Span {
  name: string;
  attributes: Record<string, unknown> = {};
  constructor(name: string) {
    this.name = name;
  }
  end(): void {
    // noop
  }
  setAttribute(key: string, value: unknown): void {
    this.attributes[key] = value;
  }
}

export function startSpan(name: string): Span {
  return new NoopSpan(name);
}

export function withSpan<T>(name: string, fn: (span: Span) => T): T {
  const span = startSpan(name);
  try {
    return fn(span);
  } finally {
    span.end();
  }
}
