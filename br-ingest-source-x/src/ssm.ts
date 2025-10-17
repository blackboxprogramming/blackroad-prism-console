import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const client = new SSMClient({ region: process.env.AWS_REGION });

export async function getSecureParameter(name: string): Promise<string> {
  const response = await client.send(new GetParameterCommand({
    Name: name,
    WithDecryption: true,
  }));
  return response.Parameter?.Value ?? '';
}
