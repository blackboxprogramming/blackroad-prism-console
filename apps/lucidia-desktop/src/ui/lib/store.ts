import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '@/shared/types';
import { getSettings, saveSettings } from './ipc';

interface SettingsState extends Settings {
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'system',
  keybindings: {
    'command.palette': 'mod+k'
  },
  modelRouting: 'local',
  dataDirectory: '',
  network: {
    allowGateway: false,
    allowTelemetry: false
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      async hydrate() {
        const loaded = await getSettings();
        set({ ...defaultSettings, ...loaded });
      },
      async update(patch) {
        const next = { ...get(), ...patch } as Settings;
        const saved = await saveSettings(next);
        set(saved);
      }
    }),
    {
      name: 'lucidia-settings',
      partialize: (state) => ({
        theme: state.theme,
        keybindings: state.keybindings,
        modelRouting: state.modelRouting,
        dataDirectory: state.dataDirectory,
        network: state.network
      })
    }
  )
);
