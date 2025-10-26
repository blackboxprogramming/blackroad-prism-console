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
