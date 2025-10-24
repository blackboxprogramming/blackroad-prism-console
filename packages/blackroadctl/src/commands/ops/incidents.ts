import ControlPlaneClient from '@blackroad/control-plane-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { printIncidents } from '../../lib/printing';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface OpsIncidentsOptions {
  serviceId: string;
  limit?: number;
  telemetry: TelemetryHandle;
}

export async function runOpsIncidents(options: OpsIncidentsOptions) {
  const config = loadConfig();
  assertCapability(config, 'ops:incidents');
  const client = new ControlPlaneClient({
    endpoint: config.endpoint,
    token: config.token,
    devToken: config.devToken
  });

  try {
    const { incidents } = await client.recentIncidents(options.serviceId, options.limit);
    printIncidents(incidents);
  } finally {
    endTelemetry(options.telemetry);
  }
}
