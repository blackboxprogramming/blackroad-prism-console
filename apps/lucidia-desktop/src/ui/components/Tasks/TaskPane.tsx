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
