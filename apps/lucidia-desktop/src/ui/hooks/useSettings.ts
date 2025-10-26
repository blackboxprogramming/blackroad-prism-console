import { useCallback } from 'react';
import { useSettingsStore } from '@/ui/lib/store';
import { Settings } from '@/shared/types';

export const useSettings = () => {
  const settings = useSettingsStore();

  const update = useCallback(
    async (patch: Partial<Settings>) => {
      await useSettingsStore.getState().update(patch);
    },
    []
  );

  return { settings, update };
};
