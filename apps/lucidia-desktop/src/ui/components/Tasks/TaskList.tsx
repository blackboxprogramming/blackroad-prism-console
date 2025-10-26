import { Task } from '@/shared/types';

interface TaskListProps {
  tasks: Task[];
  onSelect: (task: Task) => void;
}

const STATUS_LABEL: Record<Task['status'], string> = {
  todo: 'To do',
  running: 'Running',
  done: 'Done',
  failed: 'Failed'
};

export const TaskList = ({ tasks, onSelect }: TaskListProps) => (
  <ul className="space-y-2">
    {tasks.map((task) => (
      <li key={task.id}>
        <button
          onClick={() => onSelect(task)}
          className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-left hover:border-slate-700 hover:bg-slate-800"
        >
          <div>
            <p className="text-sm font-semibold text-white">{task.title}</p>
            <p className="text-xs text-slate-400">{STATUS_LABEL[task.status]}</p>
          </div>
          <span className="text-xs text-slate-500">{new Date(task.updatedAt).toLocaleTimeString()}</span>
        </button>
      </li>
    ))}
  </ul>
);
import { Task } from '../../../shared/types';
import clsx from 'classnames';

interface TaskListProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TaskList({ tasks, selectedId, onSelect }: TaskListProps) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={clsx('task-item', { selected: task.id === selectedId })}
          onClick={() => onSelect(task.id)}
        >
          <div className="task-title">{task.title}</div>
          <div className={`task-status task-status-${task.status}`}>{task.status}</div>
        </li>
      ))}
    </ul>
  );
}
