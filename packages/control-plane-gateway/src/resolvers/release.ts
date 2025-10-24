import { GraphQLResolveInfo } from 'graphql';
import { assertRole } from '../auth/oidc';
import { AuditEvent, Release } from '../domain';
import { getDeployAdapter } from '../adapters';
import { GatewayContext } from '../store';

interface ReleasesArgs {
  serviceId: string;
  envId?: string;
}

interface DeployCreateArgs {
  serviceId: string;
  envId: string;
  sha: string;
  version?: string;
}

interface DeployPromoteArgs {
  releaseId: string;
  toEnvId: string;
}

export const releaseResolvers = {
  Query: {
    releases(_parent: unknown, args: ReleasesArgs, context: GatewayContext): Release[] {
      assertRole(context.principal, 'viewer');
      const releases = context.store.listReleases(args.serviceId);
      if (args.envId) {
        return releases.filter((release) => release.envId === args.envId);
      }
      return releases;
    }
  },
  Mutation: {
    async deployCreate(_parent: unknown, args: DeployCreateArgs, context: GatewayContext, _info: GraphQLResolveInfo) {
      assertRole(context.principal, 'deployer');
      const service = context.store.getService(args.serviceId);
      if (!service) {
        throw new Error(`Service ${args.serviceId} not found`);
      }
      const env = context.store.getEnvironment(args.envId);
      if (!env) {
        throw new Error(`Environment ${args.envId} not found`);
      }
      const adapterName = service.adapters.deployments[0];
      if (!adapterName) {
        throw new Error(`Service ${service.id} has no deployment adapter`);
      }

      const release = context.store.createRelease({
        serviceId: args.serviceId,
        envId: args.envId,
        sha: args.sha,
        version: args.version,
        status: 'Promoting'
      });

      const adapter = getDeployAdapter(adapterName);
      const plan = await adapter.plan({ service, env, release });
      await adapter.apply(plan, {
        onEvent: async (event) => {
          await context.audit.publish({ ...event, metadata: { ...event.metadata, serviceId: service.id } });
        }
      });

      release.status = 'Active';
      await context.store.persist();

      const audit = await publishAudit(context, {
        action: 'deploy.create',
        subjectId: release.id,
        metadata: context.store.auditMetadataForRelease(release)
      });

      return { release, audit };
    },
    async deployPromote(_parent: unknown, args: DeployPromoteArgs, context: GatewayContext) {
      assertRole(context.principal, 'deployer');
      const sourceRelease = context.store.getRelease(args.releaseId);
      if (!sourceRelease) {
        throw new Error(`Release ${args.releaseId} not found`);
      }
      const service = context.store.getService(sourceRelease.serviceId);
      if (!service) {
        throw new Error(`Service ${sourceRelease.serviceId} not found`);
      }
      const env = context.store.getEnvironment(args.toEnvId);
      if (!env) {
        throw new Error(`Environment ${args.toEnvId} not found`);
      }
      const adapter = getDeployAdapter(service.adapters.deployments[0]);
      const promotedRelease = context.store.createRelease({
        serviceId: service.id,
        envId: env.id,
        sha: sourceRelease.sha,
        version: sourceRelease.version,
        status: 'Promoting'
      });
      const plan = await adapter.plan({ service, env, release: promotedRelease });
      await adapter.apply(plan, {
        onEvent: async (event) => {
          await context.audit.publish({ ...event, metadata: { ...event.metadata, serviceId: service.id } });
        }
      });
      promotedRelease.status = 'Active';
      await context.store.persist();

      const audit = await publishAudit(context, {
        action: 'deploy.promote',
        subjectId: promotedRelease.id,
        metadata: context.store.auditMetadataForRelease(promotedRelease)
      });

      return { release: promotedRelease, audit };
    }
  }
};

async function publishAudit(
  context: GatewayContext,
  input: { action: string; subjectId: string; metadata: Record<string, unknown> }
): Promise<AuditEvent> {
  const audit: AuditEvent = {
    ts: new Date().toISOString(),
    actor: context.principal.id,
    action: input.action,
    subjectType: 'Release',
    subjectId: input.subjectId,
    metadata: input.metadata
  };
  await context.audit.publish(audit);
  return audit;
}
