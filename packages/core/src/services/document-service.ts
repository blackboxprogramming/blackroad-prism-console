import { createHash } from "crypto";
import type { AccountApp, Document } from "@blackroad/db";
import type { InMemoryStore } from "./store.js";
import { renderFormCrs, renderPrivacyNotice } from "../templates/documents.js";
import { buildPacket } from "@blackroad/integrations";

const CHANNEL_DOCS: Record<string, string[]> = {
  RIA: ["FORM_CRS", "ADV_AGREEMENT", "PRIVACY"],
  BD: ["FORM_CRS", "BD_RBI_DISCLOSURE", "PRIVACY"],
  INSURANCE: ["INS_CONSENT", "PRIVACY"],
  CRYPTO: ["CRYPTO_RISK", "PRIVACY"],
};

export class DocumentService {
  constructor(private readonly store: InMemoryStore) {}

  generateForAccount(accountApp: AccountApp, requested: string[]): Document[] {
    const docs = new Set<string>();
    const baseDocs = CHANNEL_DOCS[accountApp.channel] ?? [];
    baseDocs.forEach((doc) => docs.add(doc));
    requested.forEach((doc) => docs.add(doc));

    const generated: Document[] = [];

    docs.forEach((kind) => {
      let content: Buffer;
      if (kind === "FORM_CRS") {
        content = Buffer.from(renderFormCrs(accountApp.clientId), "utf-8");
      } else if (kind === "PRIVACY") {
        content = Buffer.from(renderPrivacyNotice(accountApp.clientId), "utf-8");
      } else if (kind === "CUSTODY_PACKET") {
        content = buildPacket({ custodian: accountApp.channel, accountApp });
      } else {
        content = Buffer.from(`# ${kind}\nGenerated ${new Date().toISOString()}`);
      }
      const sha256 = createHash("sha256").update(content).digest("hex");
      const document = this.store.createDocument({
        accountAppId: accountApp.id,
        clientId: accountApp.clientId,
        kind,
        path: `memory://${accountApp.id}/${kind}.txt`,
        sha256,
        meta: { size: content.byteLength },
      });
      generated.push(document);
    });

    return generated;
  }
}
