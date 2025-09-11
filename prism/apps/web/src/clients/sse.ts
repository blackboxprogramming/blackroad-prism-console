import { PrismEvent } from '@prism/core';

export function connect(projectId: string, sessionId: string, onEvent: (e: PrismEvent) => void) {
  const es = new EventSource(`/events/stream?projectId=${projectId}&sessionId=${sessionId}`);
  es.addEventListener('prism', (ev) => {
    const data = (ev as MessageEvent).data;
    onEvent(JSON.parse(data));
  });
  return () => es.close();
}
