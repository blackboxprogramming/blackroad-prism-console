import { Task } from '../../../shared/types';
import { LogsViewer } from './LogsViewer';

interface TaskDetailProps {
  task: Task | null;
}

export function TaskDetail({ task }: TaskDetailProps) {
  if (!task) {
    return null;
  }
  return (
    <div className="task-detail">
      <h3>{task.title}</h3>
      <p>Status: {task.status}</p>
      <LogsViewer log={task.log} />
    </div>
  );
}
