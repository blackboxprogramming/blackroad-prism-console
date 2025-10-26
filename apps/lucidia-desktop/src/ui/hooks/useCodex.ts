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
