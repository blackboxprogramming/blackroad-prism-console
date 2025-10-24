interface TelemetrySpan {
  finish(): void;
}

class ConsoleSpan implements TelemetrySpan {
  constructor(private readonly name: string, private readonly startedAt: number = Date.now()) {
    console.log(`[telemetry] start ${name}`);
  }

  finish() {
    const duration = Date.now() - this.startedAt;
    console.log(`[telemetry] finish ${this.name} in ${duration}ms`);
  }
}

export interface TelemetryHandle {
  span: TelemetrySpan;
}

export function configureTelemetry(operation: string): TelemetryHandle {
  return { span: new ConsoleSpan(operation) };
}

export function endTelemetry(handle: TelemetryHandle) {
  handle.span.finish();
}
