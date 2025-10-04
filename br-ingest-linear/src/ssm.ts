import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const client = new SSMClient({});

export async function getSecret(name: string): Promise<string> {
  const response = await client.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  const value = response.Parameter?.Value;
  if (!value) {
    throw new Error(`Parameter ${name} not found`);
  }
  return value;
}
