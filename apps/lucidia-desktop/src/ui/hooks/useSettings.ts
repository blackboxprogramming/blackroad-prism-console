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
import { useState } from 'react';
import { Settings } from '../../shared/types';

const defaultSettings: Settings = {
  theme: 'system',
  keybindings: {
    'command-palette': 'Mod+K'
  },
  modelRouting: 'local',
  dataDir: 'lucidia',
  network: {
    allowGateway: false,
    allowTelemetry: false
  }
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  return {
    settings,
    updateSettings: setSettings
  };
}
