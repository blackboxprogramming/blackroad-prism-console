import { Task } from '@/shared/types';
import { Task } from '../../../shared/types';
import { LogsViewer } from './LogsViewer';

interface TaskDetailProps {
  task: Task | null;
}

export const TaskDetail = ({ task }: TaskDetailProps) => (
  <div className="space-y-3">
    {task ? (
      <>
        <div>
          <h3 className="text-lg font-semibold text-white">{task.title}</h3>
          <p className="text-xs text-slate-400">Status: {task.status}</p>
        </div>
        <LogsViewer task={task} />
      </>
    ) : (
      <p className="text-sm text-slate-400">Select a task to view details.</p>
    )}
  </div>
);
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
