import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const client = new SSMClient({});

export async function getSecureParameter(name: string): Promise<string> {
  if (!name) {
    throw new Error('parameter_name_required');
  }
  const resp = await client.send(
    new GetParameterCommand({
      Name: name,
      WithDecryption: true,
    })
  );
  const value = resp.Parameter?.Value;
  if (!value) {
    throw new Error(`parameter_missing:${name}`);
  }
  return value;
}
