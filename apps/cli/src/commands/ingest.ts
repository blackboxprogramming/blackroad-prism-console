import { readFileSync } from "node:fs";
import { MockCRDAdapter } from "@blackroad/integrations";
import { saveBrokerCheckSummary } from "../storage.js";

export async function ingestBrokerCheck(filePath: string): Promise<void> {
  const adapter = new MockCRDAdapter();
  const buffer = readFileSync(filePath);
  const parsed = await adapter.parseBrokerCheck(buffer);
  saveBrokerCheckSummary({
    source: filePath,
    parsed,
  });
  // eslint-disable-next-line no-console
  console.log(`Ingested BrokerCheck PDF from ${filePath}.`);
}
