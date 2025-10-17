import { randomUUID } from "node:crypto";
import { CryptoConfig, KeyEnvelope } from "./types.js";

export interface KeyMaterial {
  plaintextKey: string;
  envelope: KeyEnvelope;
}

export function createKeyEnvelope(
  ownerId: string,
  config: CryptoConfig
): KeyMaterial {
  const keyId = randomUUID();
  const now = new Date().toISOString();
  const plaintextKey = randomUUID().replace(/-/g, "");
  const envelope: KeyEnvelope = {
    ownerId,
    keyId,
    algorithm: config.dataKeyAlgorithm,
    encryptedKey: `kek:${config.kekAlgorithm}:${plaintextKey}`,
    createdAt: now,
    metadata: {
      pqcEnabled: config.pqcEnabled,
    },
  };

  return { plaintextKey, envelope };
}

export function rotateKeyEnvelope(
  existing: KeyEnvelope,
  config: CryptoConfig
): KeyMaterial {
  return createKeyEnvelope(existing.ownerId, config);
}

export function defaultCryptoConfig(): CryptoConfig {
  return {
    kekAlgorithm: "AES-256-GCM",
    dataKeyAlgorithm: "XChaCha20-Poly1305",
    pqcEnabled: false,
  };
}
