import { upsertDeal as hsDeal } from '../connectors/hubspot.js';
import { upsertOpportunity as sfOpp } from '../connectors/salesforce.js';

export async function processDeal(input: { name: string; amount: number; stage: string }, env: any) {
  const hs = await hsDeal(env.HUBSPOT_TOKEN, input.name, input.amount, input.stage);
  const sf = await sfOpp(env.SALESFORCE_URL, env.SALESFORCE_TOKEN, { Name: input.name, Amount: input.amount, StageName: input.stage, CloseDate: new Date().toISOString().slice(0,10) });
  return { ok: true, hs, sf };
}
