import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const client = new SSMClient({});

export async function putSecureParameter(name: string, value: string) {
  if (!name) {
    throw new Error('Parameter name required');
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Parameter value required');
  }
  await client.send(
    new PutParameterCommand({
      Name: name,
      Value: value,
      Type: 'SecureString',
      Overwrite: true,
    })
  );
}
