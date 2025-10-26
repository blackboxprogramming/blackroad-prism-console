import { CodexDoc } from '@/shared/types';

interface MemoryListProps {
  documents: CodexDoc[];
  onSelect: (doc: CodexDoc) => void;
}

export const MemoryList = ({ documents, onSelect }: MemoryListProps) => (
  <ul className="space-y-2">
    {documents.map((doc) => (
      <li key={doc.id}>
        <button
          onClick={() => onSelect(doc)}
          className="w-full rounded-md border border-transparent px-3 py-2 text-left hover:border-slate-700 hover:bg-slate-800"
        >
          <p className="text-sm font-semibold text-white">{doc.title}</p>
          <p className="mt-1 text-xs text-slate-400">{doc.tags.join(', ') || 'untagged'}</p>
        </button>
      </li>
    ))}
  </ul>
);
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
