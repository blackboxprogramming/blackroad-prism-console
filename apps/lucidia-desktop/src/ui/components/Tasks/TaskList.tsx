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
