import ControlPlaneClient from '@blackroad/control-plane-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { printReleaseSummary } from '../../lib/printing';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface OpsStatusOptions {
  serviceId: string;
  telemetry: TelemetryHandle;
}

export async function runOpsStatus(options: OpsStatusOptions) {
  const config = loadConfig();
  assertCapability(config, 'ops:status');
  const client = new ControlPlaneClient({
    endpoint: config.endpoint,
    token: config.token,
    devToken: config.devToken
  });

  try {
    const { service, releases } = await client.serviceStatus(options.serviceId);
    printReleaseSummary(service, releases);
  } finally {
    endTelemetry(options.telemetry);
  }
}
