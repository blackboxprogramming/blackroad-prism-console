export interface Identity {
  id: string;
  publicKey: string;
  settings: Record<string, unknown>;
}

export interface Box {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface Item {
  id: string;
  ownerId: string;
  rawText: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  itemId: string;
  boxId: string;
  score: number;
  rationale: string;
  createdAt: string;
}

export interface ConsentReceipt {
  id: string;
  ownerId: string;
  purpose: string;
  scope: string;
  createdAt: string;
  expiresAt?: string;
}

export interface AuditLogEntry {
  id: string;
  ownerId: string;
  actor: string;
  action: string;
  rationale?: string;
  createdAt: string;
  ip?: string;
  device?: string;
}

export interface ClassificationSuggestion {
  title: string;
  score: number;
  rationale: string;
  tags: string[];
}

export interface ClassifiedBoxSuggestion extends ClassificationSuggestion {
  boxId?: string;
}

export interface ClassificationResponse {
  suggestions: ClassifiedBoxSuggestion[];
  seed: number;
}

export interface KeyEnvelope {
  ownerId: string;
  keyId: string;
  encryptedKey: string;
  algorithm: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface CryptoConfig {
  kekAlgorithm: string;
  dataKeyAlgorithm: string;
  pqcEnabled: boolean;
}
