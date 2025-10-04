import { SSMClient, PutParameterCommand, GetParameterCommand } from '@aws-sdk/client-ssm';

const client = new SSMClient({ region: process.env.AWS_REGION });

export const ssm = {
  async put(name: string, value: string) {
    await client.send(new PutParameterCommand({
      Name: name,
      Value: value,
      Type: 'SecureString',
      Overwrite: true,
    }));
  },
  async get(name: string) {
    const response = await client.send(new GetParameterCommand({
      Name: name,
      WithDecryption: true,
    }));
    return response.Parameter?.Value ?? '';
  },
};
