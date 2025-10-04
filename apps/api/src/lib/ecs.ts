import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

const client = new ECSClient({});

export interface RunIngestOptions {
  sourceId: string;
  tokenParameter: string;
}

function parseList(input?: string) {
  if (!input) return [] as string[];
  return input.split(',').map((s) => s.trim()).filter(Boolean);
}

export async function triggerStripeIngest({ sourceId, tokenParameter }: RunIngestOptions) {
  const cluster = process.env.STRIPE_INGEST_ECS_CLUSTER;
  const taskDefinition = process.env.STRIPE_INGEST_ECS_TASK;
  if (!cluster || !taskDefinition) {
    console.warn('Stripe ingest ECS configuration missing, skipping RunTask trigger');
    return { triggered: false } as const;
  }
  const containerName = process.env.STRIPE_INGEST_ECS_CONTAINER || 'app';
  const securityGroups = parseList(process.env.STRIPE_INGEST_ECS_SECURITY_GROUPS);
  const subnets = parseList(process.env.STRIPE_INGEST_ECS_SUBNETS);
  const assignPublicIp = (process.env.STRIPE_INGEST_ECS_ASSIGN_PUBLIC_IP || 'ENABLED').toUpperCase();

  await client.send(
    new RunTaskCommand({
      cluster,
      taskDefinition,
      launchType: 'FARGATE',
      count: 1,
      networkConfiguration:
        subnets.length || securityGroups.length
          ? {
              awsvpcConfiguration: {
                subnets,
                securityGroups,
                assignPublicIp: (assignPublicIp === 'DISABLED' ? 'DISABLED' : 'ENABLED') as 'ENABLED' | 'DISABLED',
              },
            }
          : undefined,
      overrides: {
        containerOverrides: [
          {
            name: containerName,
            environment: [
              { name: 'SOURCE_ID', value: sourceId },
              { name: 'STRIPE_TOKEN_PARAM', value: tokenParameter },
            ],
          },
        ],
      },
    })
  );
  return { triggered: true } as const;
}
