export interface SpanHandle {
  end(): void;
}

class ConsoleSpan implements SpanHandle {
  constructor(private readonly name: string, private readonly start = Date.now()) {
    // eslint-disable-next-line no-console
    console.log(`[otel] span start ${name}`);
  }

  end() {
    const duration = Date.now() - this.start;
    // eslint-disable-next-line no-console
    console.log(`[otel] span end ${this.name} in ${duration}ms`);
  }
}

export function withSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T> | T {
  const span = new ConsoleSpan(name);
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(() => span.end());
    }
    span.end();
    return result;
  } catch (error) {
    span.end();
    throw error;
  }
}
