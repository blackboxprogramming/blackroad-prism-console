import { loadConfig } from './config';
import { assertCapability } from './auth';

interface GraphRequestOptions {
  query: string;
  variables?: Record<string, unknown>;
  capability: Parameters<typeof assertCapability>[1];
}

export async function executeGraphRequest<T>(options: GraphRequestOptions): Promise<T> {
  const config = loadConfig();
  assertCapability(config, options.capability);
  const endpoint = process.env.GRAPH_GATEWAY_ENDPOINT ?? 'http://localhost:4800/graphql';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: options.query, variables: options.variables })
  });
  if (!response.ok) {
    throw new Error(`Graph gateway responded with ${response.status}`);
  }
  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}
