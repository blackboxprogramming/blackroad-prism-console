import { Task } from '@/shared/types';

export const LogsViewer = ({ task }: { task: Task | null }) => {
  if (!task) {
    return <p className="text-sm text-slate-400">Select a task to view logs.</p>;
  }

  return (
    <div className="max-h-48 overflow-y-auto rounded-md border border-slate-700 bg-surface-muted p-3">
      <ul className="space-y-2 text-xs text-slate-300">
        {task.logs.map((log) => (
          <li key={log.id}>
            <span className="font-semibold text-slate-200">[{log.level.toUpperCase()}]</span>{' '}
            <span>{log.message}</span>
            <span className="ml-2 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
import { TaskLogEntry } from '../../../shared/types';

interface LogsViewerProps {
  log: TaskLogEntry[];
}

export function LogsViewer({ log }: LogsViewerProps) {
  return (
    <div className="logs-viewer">
      <h4>Logs</h4>
      <ul>
        {log.map((entry) => (
          <li key={entry.id} className={`log-entry log-${entry.level}`}>
            <time>{new Date(entry.timestamp).toLocaleTimeString()}</time>
            <span>{entry.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
}
