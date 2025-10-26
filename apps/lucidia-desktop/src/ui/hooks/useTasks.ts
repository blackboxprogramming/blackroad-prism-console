import { useTaskStore } from '../lib/store';

export function useTasks() {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);

  return {
    tasks,
    addTask,
    updateTaskStatus
  };
}
