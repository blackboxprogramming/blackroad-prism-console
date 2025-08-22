export class PredictiveLoader {
  private patterns = new Map<string, {resource: string; confidence: number}>();
  private controller: AbortController | null = null;

  learn(signature: string, resource: string, confidence: number) {
    if (confidence >= 0.6) this.patterns.set(signature, { resource, confidence });
  }

  async anticipate(signature: string) {
    const hit = this.patterns.get(signature);
    if (!hit || hit.confidence < 0.8 || navigator.connection?.saveData) return;

    this.controller?.abort();
    this.controller = new AbortController();

    try {
      const t = performance.now();
      const resp = await fetch(hit.resource, { signal: this.controller.signal });
      if (performance.now() - t < 150) this.controller.abort(); // user acted; bail
      return resp;
    } catch { /* swallow */ }
  }
}
