import { z } from 'zod';

export interface FiscalProfile {
  fiscalYearEnd: string; // ISO date (month-day) for FY end reference
}

export interface LicenseRecord {
  track: 'RIA' | 'BD' | 'INSURANCE' | 'REALESTATE';
  stateCode?: string;
  licenseNumber: string;
  expiryDate: string; // ISO date
}

export interface LicenseMatrixClient {
  getFiscalProfile(): Promise<FiscalProfile>;
  getLicenses(): Promise<LicenseRecord[]>;
}

export interface CompliancePolicy {
  id: string;
  title: string;
  version: number;
  effectiveDate: string;
  materialToClients: boolean;
}

export interface ComplianceOSClient {
  listPolicies(): Promise<CompliancePolicy[]>;
  latestMaterialChangeSince(timestamp: string): Promise<CompliancePolicy | null>;
}

export interface ClientContact {
  id: string;
  email?: string;
  portalId?: string;
  mailingAddress?: string;
}

export interface ClientOSClient {
  listClients(): Promise<ClientContact[]>;
  resolveRecipients(ids: string[]): Promise<ClientContact[]>;
}

export interface SubmissionResult {
  status: 'ACCEPTED' | 'SUBMITTED' | 'REJECTED';
  receiptPath?: string;
  confirmationNumber?: string;
}

export interface IARDClient {
  calculateFees(payload: Record<string, unknown>): Promise<number>;
  submit(payload: Record<string, unknown>): Promise<SubmissionResult>;
}

export interface StatePortalClient {
  submit(
    stateCode: string,
    payload: Record<string, unknown>
  ): Promise<SubmissionResult>;
}

export interface EmailDeliveryClient {
  sendEmail(
    target: { email: string; name?: string },
    message: { subject: string; body: string },
    attachments?: Array<{ name: string; path: string }>
  ): Promise<{ evidencePath: string; messageId: string }>;
}

export const licenseRecordSchema = z.object({
  track: z.enum(['RIA', 'BD', 'INSURANCE', 'REALESTATE']),
  stateCode: z.string().optional(),
  licenseNumber: z.string(),
  expiryDate: z.string()
});

export class InMemoryLicenseMatrix implements LicenseMatrixClient {
  constructor(private readonly records: LicenseRecord[], private readonly fiscalYearEnd: string) {}

  async getFiscalProfile(): Promise<FiscalProfile> {
    return { fiscalYearEnd: this.fiscalYearEnd };
  }

  async getLicenses(): Promise<LicenseRecord[]> {
    return this.records;
  }
}

export class StaticComplianceOS implements ComplianceOSClient {
  constructor(private readonly policies: CompliancePolicy[]) {}

  async listPolicies(): Promise<CompliancePolicy[]> {
    return this.policies;
  }

  async latestMaterialChangeSince(timestamp: string): Promise<CompliancePolicy | null> {
    const since = new Date(timestamp).getTime();
    const matches = this.policies
      .filter((p) => p.materialToClients && new Date(p.effectiveDate).getTime() > since)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    return matches[0] ?? null;
  }
}

export class InMemoryClientOS implements ClientOSClient {
  constructor(private readonly clients: ClientContact[]) {}

  async listClients(): Promise<ClientContact[]> {
    return this.clients;
  }

  async resolveRecipients(ids: string[]): Promise<ClientContact[]> {
    const map = new Map(this.clients.map((client) => [client.id, client] as const));
    return ids.map((id) => map.get(id)).filter((v): v is ClientContact => Boolean(v));
  }
}

export class StubIARDClient implements IARDClient {
  async calculateFees(payload: Record<string, unknown>): Promise<number> {
    return Array.isArray(payload?.['advisers']) ? payload['advisers'].length * 15000 : 45000;
  }

  async submit(payload: Record<string, unknown>): Promise<SubmissionResult> {
    return {
      status: 'SUBMITTED',
      receiptPath: `/receipts/iard/${Date.now()}.json`,
      confirmationNumber: `IARD-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
    };
  }
}

export class StubStatePortalClient implements StatePortalClient {
  async submit(stateCode: string, payload: Record<string, unknown>): Promise<SubmissionResult> {
    return {
      status: 'ACCEPTED',
      receiptPath: `/receipts/state/${stateCode}-${Date.now()}.json`,
      confirmationNumber: `${stateCode}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    };
  }
}

export class StubEmailDeliveryClient implements EmailDeliveryClient {
  async sendEmail(
    target: { email: string; name?: string },
    message: { subject: string; body: string },
    attachments: Array<{ name: string; path: string }> = []
  ): Promise<{ evidencePath: string; messageId: string }> {
    const payload = {
      target,
      message,
      attachments,
      sentAt: new Date().toISOString()
    };
    const evidencePath = `/evidence/email/${target.email}-${Date.now()}.json`;
    // Persist to storage in real implementation.
    return { evidencePath, messageId: `MSG-${Math.random().toString(36).slice(2, 10)}` };
  }
}
