import { useSettings } from '../../hooks/useSettings';
import { SecureTokenField } from './SecureTokenField';
import { Button } from '../Primitives/Button';

export function SettingsPane() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="settings-pane">
      <section>
        <h3>Theme</h3>
        <select
          value={settings.theme}
          onChange={(event) => updateSettings({ ...settings, theme: event.target.value as typeof settings.theme })}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </section>
      <section>
        <h3>Model Routing</h3>
        <select
          value={settings.modelRouting}
          onChange={(event) =>
            updateSettings({ ...settings, modelRouting: event.target.value as typeof settings.modelRouting })
          }
        >
          <option value="local">Local</option>
          <option value="gateway">Gateway</option>
        </select>
      </section>
      <section>
        <h3>Network</h3>
        <label>
          <input
            type="checkbox"
            checked={settings.network.allowGateway}
            onChange={(event) =>
              updateSettings({
                ...settings,
                network: { ...settings.network, allowGateway: event.target.checked }
              })
            }
          />
          Allow gateway access
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.network.allowTelemetry}
            onChange={(event) =>
              updateSettings({
                ...settings,
                network: { ...settings.network, allowTelemetry: event.target.checked }
              })
            }
          />
          Allow telemetry
        </label>
      </section>
      <section>
        <h3>Secure Tokens</h3>
        <SecureTokenField label="Gateway Token" secretKey="gateway-token" />
      </section>
      <section>
        <h3>Data Management</h3>
        <Button variant="secondary">Export Bundle</Button>
        <Button variant="secondary">Import Bundle</Button>
      </section>
    </div>
  );
}
