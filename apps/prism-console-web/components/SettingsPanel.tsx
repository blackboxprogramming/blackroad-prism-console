import { useTelemetry } from '@/lib/telemetry';

const toggles = [
  { id: 'alerts', label: 'Real-time alerts' },
  { id: 'dark', label: 'Dark mode' },
  { id: 'auto-remediate', label: 'Auto-remediation' }
];

export function SettingsPanel() {
  const { track } = useTelemetry();

  return (
    <section className="card" aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="text-xl font-semibold mb-4">
        Settings
      </h2>
      <form className="space-y-4">
        {toggles.map((toggle) => (
          <label key={toggle.id} className="flex items-center justify-between">
            <span className="text-sm text-slate-200">{toggle.label}</span>
            <input
              type="checkbox"
              className="accent-brand"
              onChange={() => track({ type: 'shortcut:click', id: toggle.id })}
              defaultChecked
            />
          </label>
        ))}
      </form>
    </section>
  );
}
