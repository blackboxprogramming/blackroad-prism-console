import { ChatThread } from '@/shared/types';
import { Button } from '@/ui/components/Primitives/Button';

interface ThreadListProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export const ThreadList = ({ threads, activeThreadId, onSelect, onNew }: ThreadListProps) => (
  <div className="flex h-full flex-col gap-4">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase text-slate-400">Threads</h2>
      <Button variant="ghost" onClick={onNew} aria-label="Create new thread">
        +
      </Button>
    </div>
    <nav className="flex-1 space-y-2 overflow-y-auto">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelect(thread.id)}
          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
            thread.id === activeThreadId ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <p className="font-medium">{thread.title}</p>
          <p className="text-xs text-slate-400">{new Date(thread.updatedAt).toLocaleString()}</p>
        </button>
      ))}
    </nav>
  </div>
);
import { ChatThread } from '../../../shared/types';
import clsx from 'classnames';

interface ThreadListProps {
  threads: ChatThread[];
  activeThreadId?: string;
  onSelect: (id: string) => void;
}

export function ThreadList({ threads, activeThreadId, onSelect }: ThreadListProps) {
  return (
    <ul className="thread-list">
      {threads.map((thread) => (
        <li
          key={thread.id}
          className={clsx('thread-item', { active: thread.id === activeThreadId })}
          onClick={() => onSelect(thread.id)}
        >
          <div className="thread-title">{thread.title}</div>
          <div className="thread-meta">{new Date(thread.updatedAt).toLocaleString()}</div>
        </li>
      ))}
    </ul>
  );
}
