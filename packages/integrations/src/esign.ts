import { nanoid } from "nanoid";

export type EnvelopeStatus = "PENDING" | "COMPLETED" | "DECLINED";

export interface EnvelopeDocument {
  name: string;
  content: Buffer;
}

export interface EnvelopeMeta {
  accountAppId: string;
  clientId: string;
  documents: string[];
}

const envelopes = new Map<string, { status: EnvelopeStatus; meta: EnvelopeMeta; docs: EnvelopeDocument[] }>();

export async function createEnvelope(meta: EnvelopeMeta, docs: EnvelopeDocument[]) {
  const envelopeId = nanoid();
  envelopes.set(envelopeId, { status: "PENDING", meta, docs });
  return { envelopeId };
}

export async function pollEnvelope(envelopeId: string): Promise<EnvelopeStatus> {
  const envelope = envelopes.get(envelopeId);
  if (!envelope) {
    throw new Error(`Envelope ${envelopeId} not found`);
  }
  return envelope.status;
}

export async function markEnvelopeCompleted(envelopeId: string) {
  const envelope = envelopes.get(envelopeId);
  if (!envelope) {
    throw new Error(`Envelope ${envelopeId} not found`);
  }
  envelope.status = "COMPLETED";
}

export async function markEnvelopeDeclined(envelopeId: string) {
  const envelope = envelopes.get(envelopeId);
  if (!envelope) {
    throw new Error(`Envelope ${envelopeId} not found`);
  }
  envelope.status = "DECLINED";
}

export function getEnvelopeDocuments(envelopeId: string): EnvelopeDocument[] {
  const envelope = envelopes.get(envelopeId);
  if (!envelope) {
    throw new Error(`Envelope ${envelopeId} not found`);
  }
  return envelope.docs;
}
