export interface Span {
  name: string;
  start: number;
  end(): void;
}

export function createSpan(name: string): Span {
  const start = Date.now();
  return {
    name,
    start,
    end() {
      const duration = Date.now() - start;
      if (process.env.GRAPH_LABS_DEBUG) {
        console.log(`[otel] ${name} duration=${duration}ms`);
      }
    }
  };
}
