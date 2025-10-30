import { upsertLead as hsLead } from '../connectors/hubspot.js';

export async function processLead(input: { email: string; source: string; props?: Record<string, any> }, env: any) {
  const email = input.email.toLowerCase().trim();
  const props = { source: input.source, ...input.props };
  const lead = await hsLead(env.HUBSPOT_TOKEN, email, props);
  return { ok: true, lead };
}
