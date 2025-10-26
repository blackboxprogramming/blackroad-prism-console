import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listMemory, queryCodex, saveMemory } from '@/ui/lib/ipc';

export const useCodex = () => {
  const queryClient = useQueryClient();

  const memoryQuery = useQuery({
    queryKey: ['memory'],
    queryFn: async () => {
      const { items } = await listMemory();
      return items;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (input: { title: string; content: string; tags: string[] }) => {
      return saveMemory(input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memory'] })
  });

  const search = async (q: string, topK = 5) => {
    const response = await queryCodex({ q, topK });
    return response.hits;
  };

  return {
    memoryQuery,
    saveMutation,
    search
  };
};
import { useCodexStore } from '../lib/store';

export function useCodex() {
  const docs = useCodexStore((state) => state.docs);
  const addDoc = useCodexStore((state) => state.addDoc);
  const search = useCodexStore((state) => state.search);

  return {
    docs,
    addDoc,
    search
  };
}
