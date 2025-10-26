import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTask, listTasks, runTask } from '@/ui/lib/ipc';
import { Task } from '@/shared/types';

export const useTasks = () => {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => listTasks()
  });

  const runMutation = useMutation({
    mutationFn: async (payload: { title: string; args?: Record<string, unknown> }) => runTask(payload),
    onSuccess: async ({ taskId }) => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.prefetchQuery({
        queryKey: ['task', taskId],
        queryFn: async () => getTask({ id: taskId })
      });
    }
  });

  const useTask = (taskId: string | null) =>
    useQuery({
      queryKey: ['task', taskId],
      enabled: Boolean(taskId),
      queryFn: async () => getTask({ id: taskId ?? '' })
    });

  return {
    tasksQuery,
    runMutation,
    useTask
  };
};
