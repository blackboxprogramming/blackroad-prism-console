export interface BrokerCheckSnapshot {
  registrations: Array<{ state: string; status: string; effectiveDate?: string }>;
  exams: Array<{ name: string; date: string; status: string }>;
  disclosures: string[];
}

export interface CRDAdapter {
  fetchBrokerCheckPDF(crdNumber: string): Promise<Buffer>;
  parseBrokerCheck(pdf: Buffer): Promise<BrokerCheckSnapshot>;
}

export class MockCRDAdapter implements CRDAdapter {
  async fetchBrokerCheckPDF(crdNumber: string): Promise<Buffer> {
    const placeholder = `BrokerCheck placeholder for ${crdNumber}`;
    return Buffer.from(placeholder);
  }

  async parseBrokerCheck(pdf: Buffer): Promise<BrokerCheckSnapshot> {
    return {
      registrations: [],
      exams: [],
      disclosures: [],
    };
  }
}
