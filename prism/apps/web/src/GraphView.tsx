import React, { useEffect, useState } from 'react';

type Node = { id: string };

type SSE = { onmessage: ((ev: MessageEvent) => any) | null; close(): void; };

declare const EventSource: { new(url: string): SSE };

const GraphView: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  useEffect(() => {
    fetch('/graph').then(r => r.json()).then(d => setNodes(d.nodes));
    const es = new EventSource('/graph/stream');
    es.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'node' && msg.op === 'upsert') {
        setNodes(n => [...n.filter(x => x.id !== msg.data.id), msg.data]);
      }
    };
    return () => es.close();
  }, []);
  return <ul>{nodes.map(n => <li key={n.id}>{n.id}</li>)}</ul>;
};

export default GraphView;
