import ControlPlaneClient from '@blackroad/control-plane-sdk';
import { loadConfig } from '../../lib/config';
import { assertCapability } from '../../lib/auth';
import { printAuditEvent } from '../../lib/printing';
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';

interface DeployCreateOptions {
  serviceId: string;
  envId: string;
  sha: string;
  dryRun?: boolean;
  telemetry: TelemetryHandle;
}

export async function runDeployCreate(options: DeployCreateOptions) {
  const config = loadConfig();
  assertCapability(config, 'deploy:create');

  if (options.dryRun) {
    console.log(`Capability boundary: ${config.role} deploying ${options.serviceId} -> ${options.envId} @ ${options.sha} (dry run)`);
  } else {
    console.log(`Capability boundary: ${config.role} deploying ${options.serviceId} -> ${options.envId} @ ${options.sha}`);
  }

  const client = new ControlPlaneClient({
    endpoint: config.endpoint,
    token: config.token,
    devToken: config.devToken
  });

  try {
    const { audit } = await client.deployCreate({
      serviceId: options.serviceId,
      envId: options.envId,
      sha: options.sha
    });
    printAuditEvent(audit);
  } finally {
    endTelemetry(options.telemetry);
  }
}
