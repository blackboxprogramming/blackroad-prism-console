import { CommRecord } from "@lucidia/core";
import { WormLedger } from "@blackroad/worm";

export interface ConnectorContext {
  ledger: WormLedger;
}

export interface RawMessage {
  id: string;
  from: string;
  to: string[];
  subject?: string;
  sentAt: Date;
  body: string;
  channel: CommRecord["channel"];
  retentionKey: string;
}

export interface IngestedComm extends CommRecord {
  retentionKey: string;
}

export type MessageIngestor = (message: RawMessage) => Promise<IngestedComm>;

export function createMessageIngestor(context: ConnectorContext): MessageIngestor {
  return async (message: RawMessage): Promise<IngestedComm> => {
    const comm: IngestedComm = {
      id: message.id,
      channel: message.channel,
      from: message.from,
      to: message.to,
      subject: message.subject,
      threadId: undefined,
      ts: message.sentAt,
      text: message.body,
      retentionKey: message.retentionKey,
    };
    await context.ledger.append({ payload: { type: "COMM_INGESTED", commId: comm.id, channel: comm.channel } });
    return comm;
  };
}

export function hashEmailMetadata(email: RawMessage): string {
  const payload = `${email.from}|${email.to.join(",")}|${email.subject ?? ""}|${email.sentAt.toISOString()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  let hash = 0;
  for (const byte of data) {
    hash = (hash * 31 + byte) % 2 ** 32;
  }
  return hash.toString(16);
}
