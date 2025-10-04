import { createEnvelope, getEnvelopeDocuments, markEnvelopeCompleted, pollEnvelope } from "@blackroad/integrations";
import type { ClientOnboardingEngine } from "./onboarding.js";
import { append } from "@blackroad/worm";

export async function sendEnvelope(engine: ClientOnboardingEngine, accountAppId: string, docs: string[]) {
  const accountApp = engine.store.requireAccountApp(accountAppId);
  const { envelopeId } = await createEnvelope(
    { accountAppId, clientId: accountApp.clientId, documents: docs },
    engine.store.listAccountAppDocuments(accountAppId).map((doc) => ({
      name: doc.kind,
      content: Buffer.from(doc.kind, "utf-8"),
    })),
  );
  engine.recordEnvelope(accountAppId, envelopeId);
  await append(engine.worm, { type: "ESIGN_SENT", accountAppId, envelopeId });
  return { envelopeId };
}

export async function syncEnvelope(engine: ClientOnboardingEngine, envelopeId: string) {
  const status = await pollEnvelope(envelopeId);
  if (status === "COMPLETED") {
    const docs = getEnvelopeDocuments(envelopeId);
    const accountApp = [...engine.store.accountApps.values()].find((app) => app.eSignEnvelopeId === envelopeId);
    if (accountApp) {
      docs.forEach((doc) => {
        engine.store.createDocument({
          clientId: accountApp.clientId,
          accountAppId: accountApp.id,
          kind: `ESIGNED_${doc.name}`,
          path: `memory://${envelopeId}/${doc.name}`,
          sha256: doc.content.toString("hex"),
          meta: { envelopeId },
        });
      });
      engine.markAccountAppStatus(accountApp.id, "ReadyToSubmit");
      await append(engine.worm, { type: "ESIGN_COMPLETED", accountAppId: accountApp.id, envelopeId });
    }
  }
  return status;
}

export async function forceComplete(envelopeId: string) {
  await markEnvelopeCompleted(envelopeId);
}
