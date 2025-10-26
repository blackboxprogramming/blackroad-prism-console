import { CodexDoc } from '../../../shared/types';
import clsx from 'classnames';

interface MemoryListProps {
  docs: CodexDoc[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MemoryList({ docs, selectedId, onSelect }: MemoryListProps) {
  return (
    <ul className="memory-list">
      {docs.map((doc) => (
        <li
          key={doc.id}
          className={clsx('memory-item', { selected: doc.id === selectedId })}
          onClick={() => onSelect(doc.id)}
        >
          <div className="memory-title">{doc.title || 'Untitled'}</div>
          <div className="memory-tags">{doc.tags.join(', ')}</div>
        </li>
      ))}
    </ul>
  );
}
