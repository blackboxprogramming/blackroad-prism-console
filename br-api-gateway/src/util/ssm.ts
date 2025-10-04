import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const client = new SSMClient({ region: REGION });
const cache = new Map<string, Promise<string>>();

async function fetchParameter(name: string): Promise<string> {
  const res = await client.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  const value = res.Parameter?.Value;
  if (!value) {
    throw new Error(`Parameter ${name} missing or empty`);
  }
  return value;
}

export const ssm = {
  get(name: string) {
    if (!cache.has(name)) {
      cache.set(name, fetchParameter(name));
    }
    return cache.get(name)!;
  }
};
