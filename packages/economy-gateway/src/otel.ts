interface Span {
  end(): void;
}

class ConsoleSpan implements Span {
  constructor(private readonly name: string, private readonly started = Date.now()) {
    console.log(`[otel] start ${name}`);
  }

  end() {
    const duration = Date.now() - this.started;
    console.log(`[otel] end ${this.name} (${duration}ms)`);
  }
}

export function startSpan(name: string): Span {
  return new ConsoleSpan(name);
}
