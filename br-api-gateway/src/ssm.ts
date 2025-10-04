import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';

const client = new SSMClient({});

export async function putSecureParameter(name: string, value: string): Promise<void> {
  if (!name) {
    throw new Error('Parameter name is required');
  }
  await client.send(new PutParameterCommand({
    Name: name,
    Value: value,
    Type: 'SecureString',
    Overwrite: true,
  }));
}
