import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

const ecs = new ECSClient({ region: process.env.AWS_REGION });

export async function runIngestTask(params: {
  cluster: string;
  taskDefinition: string;
  subnets: string[];
  securityGroups: string[];
  sourceId: string;
  containerName?: string;
}) {
  const containerName = params.containerName ?? 'br-ingest-source-x';

  await ecs.send(new RunTaskCommand({
    cluster: params.cluster,
    taskDefinition: params.taskDefinition,
    launchType: 'FARGATE',
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: 'DISABLED',
        subnets: params.subnets,
        securityGroups: params.securityGroups,
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: containerName,
          environment: [
            { name: 'SOURCE_ID', value: params.sourceId },
          ],
        },
      ],
    },
  }));
}
