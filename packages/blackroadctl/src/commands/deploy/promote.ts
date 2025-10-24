import ControlPlaneClient from '@blackroad/control-plane-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { printAuditEvent } from '../../lib/printing';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface DeployPromoteOptions {
  releaseId: string;
  toEnvId: string;
  telemetry: TelemetryHandle;
}

export async function runDeployPromote(options: DeployPromoteOptions) {
  const config = loadConfig();
  assertCapability(config, 'deploy:promote');
  console.log(`Capability boundary: ${config.role} promoting ${options.releaseId} -> ${options.toEnvId}`);

  const client = new ControlPlaneClient({
    endpoint: config.endpoint,
    token: config.token,
    devToken: config.devToken
  });

  try {
    const { audit } = await client.deployPromote({
      releaseId: options.releaseId,
      toEnvId: options.toEnvId
    });
    printAuditEvent(audit);
  } finally {
    endTelemetry(options.telemetry);
  }
}
