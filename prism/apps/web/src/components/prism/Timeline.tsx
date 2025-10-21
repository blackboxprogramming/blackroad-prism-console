import { PrismEvent } from '@prism/core';
import { FixedSizeList as List } from 'react-window';
import { useState } from 'react';

const filters = ['All', 'Errors', 'File', 'Run', 'Deploy'] as const;

type Props = {
  events: PrismEvent[];
};

export default function Timeline({ events }: Props) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const filtered = events.filter(e => {
    switch (filter) {
      case 'Errors':
        return e.kind === 'error';
      case 'File':
        return e.kind.startsWith('file');
      case 'Run':
        return e.kind.startsWith('run');
      case 'Deploy':
        return e.kind.startsWith('deploy');
      default:
        return true;
    }
  });

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const ev = filtered[index];
    return (
      <div style={style} className="p-2 border-b">
        <strong>{ev.kind}</strong> {ev.summary}
      </div>
    );
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <List height={400} itemCount={filtered.length} itemSize={40} width="100%">
        {Row}
      </List>
    </div>
  );
}
