import { useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { Button } from '../Primitives/Button';
import { TaskList } from './TaskList';
import { TaskDetail } from './TaskDetail';

export function TaskPane() {
  const { tasks, addTask } = useTasks();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="tasks-pane">
      <div className="tasks-sidebar">
        <Button onClick={() => setSelectedId(addTask('New Task').id)}>New Task</Button>
        <TaskList tasks={tasks} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <div className="tasks-detail">
        {selectedId ? (
          <TaskDetail task={tasks.find((task) => task.id === selectedId) ?? null} />
        ) : (
          <p>Select a task to view details.</p>
        )}
      </div>
    </div>
  );
}
