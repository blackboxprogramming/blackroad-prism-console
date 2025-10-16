import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
const ssm = new SSMClient({});
export async function getParam(name: string) {
  const r = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return r.Parameter?.Value ?? '';
}
