import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const client = new SSMClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
});

const cache = new Map<string, string>();

function envFallback(name: string): string | undefined {
  const envKey = name
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toUpperCase();
  return process.env[envKey];
}

export const ssm = {
  async get(name: string): Promise<string> {
    if (cache.has(name)) return cache.get(name)!;

    const envValue = envFallback(name);
    if (envValue) {
      cache.set(name, envValue);
      return envValue;
    }

    const result = await client.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
    const value = result.Parameter?.Value;
    if (!value) throw new Error(`SSM parameter not found: ${name}`);
    cache.set(name, value);
    return value;
  }
};
