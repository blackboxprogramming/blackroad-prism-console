import { useState } from 'react';
import { useSettings } from '@/ui/hooks/useSettings';
import { Button } from '@/ui/components/Primitives/Button';
import { Input } from '@/ui/components/Primitives/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/Primitives/Tabs';
import { SecureTokenField } from './SecureTokenField';

export const SettingsPane = () => {
  const { settings, update } = useSettings();
  const [dataDirectory, setDataDirectory] = useState(settings.dataDirectory);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Settings</h2>
      <Tabs defaultValue="preferences">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="preferences" className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400">Theme</label>
            <select
              className="w-full rounded-md border border-slate-700 bg-surface-muted px-3 py-2 text-sm text-slate-100"
              value={settings.theme}
              onChange={(event) => update({ theme: event.target.value as typeof settings.theme })}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400">Data directory</label>
            <div className="flex gap-2">
              <Input value={dataDirectory} onChange={(event) => setDataDirectory(event.target.value)} />
              <Button type="button" onClick={() => update({ dataDirectory })}>
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-slate-400">Network</label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={settings.network.allowGateway}
                onChange={(event) => update({ network: { ...settings.network, allowGateway: event.target.checked } })}
              />
              Allow gateway connections
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={settings.network.allowTelemetry}
                onChange={(event) => update({ network: { ...settings.network, allowTelemetry: event.target.checked } })}
              />
              Allow optional telemetry
            </label>
          </div>
        </TabsContent>
        <TabsContent value="security" className="space-y-4">
          <SecureTokenField storageKey="lucidia-token" />
        </TabsContent>
      </Tabs>
    </section>
  );
};
