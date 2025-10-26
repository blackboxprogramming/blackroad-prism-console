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
}
