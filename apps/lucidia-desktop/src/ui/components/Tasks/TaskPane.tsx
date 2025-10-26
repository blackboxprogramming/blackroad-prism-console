import { useState } from 'react';
import { useTasks } from '@/ui/hooks/useTasks';
import { Button } from '@/ui/components/Primitives/Button';
import { Input } from '@/ui/components/Primitives/Input';
import { Task } from '@/shared/types';
import { TaskList } from './TaskList';
import { TaskDetail } from './TaskDetail';

export const TaskPane = () => {
  const { tasksQuery, runMutation, useTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');

  const taskDetail = useTask(selectedTask?.id ?? null);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Tasks</h2>
      </header>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          runMutation.mutate({ title: title.trim() });
          setTitle('');
        }}
      >
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New task title" />
        <Button type="submit" disabled={runMutation.isPending}>
          Add
        </Button>
      </form>
      {tasksQuery.isLoading ? (
        <p className="text-sm text-slate-400">Loading tasks…</p>
      ) : (
        <TaskList tasks={tasksQuery.data ?? []} onSelect={(task) => setSelectedTask(task)} />
      )}
      <TaskDetail task={taskDetail.data ?? selectedTask ?? null} />
    </section>
  );
};
=====
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
>>>>>>> 3d867c2e88e43a0218ced55f75539cfc1ab8fa42
import { useState } from 'react';
<<<<<<<+HEAD
import { useTasks } from '@/ui/hooks/useTasks';
import { Button } from '@/ui/components/Primitives/Button';
import { Input } from '@/ui/components/Primitives/Input';
import { Task } from '@/shared/types';
import { TaskList } from './TaskList';
import { TaskDetail } from './TaskDetail';

export const TaskPane = () => {
  const { tasksQuery, runMutation, useTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');

  const taskDetail = useTask(selectedTask?.id ?? null);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Tasks</h2>
      </header>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          runMutation.mutate({ title: title.trim() });
          setTitle('');
        }}
      >
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New task title" />
        <Button type="submit" disabled={runMutation.isPending}>
          Add
        </Button>
      </form>
      {tasksQuery.isLoading ? (
        <p className="text-sm text-slate-400">Loading tasks…</p>
      ) : (
        <TaskList tasks={tasksQuery.data ?? []} onSelect={(task) => setSelectedTask(task)} />
      )}
      <TaskDetail task={taskDetail.data ?? selectedTask ?? null} />
    </section>
  );
};
=====
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
>>>>>>> 3d867c2e88e43a0218ced55f75539cfc1ab8fa42
