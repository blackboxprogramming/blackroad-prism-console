export interface LicenseSnapshot {
  licenseNumber?: string;
  status: string;
  expirationDate?: string;
  ceHoursEarned?: number;
}

export interface StatePortalAdapter {
  lookupInsurance(personLegalName: string, state: string): Promise<LicenseSnapshot | null>;
  lookupRealEstate(personLegalName: string, state: string): Promise<LicenseSnapshot | null>;
}

export class MockStatePortalAdapter implements StatePortalAdapter {
  async lookupInsurance(): Promise<LicenseSnapshot | null> {
    return null;
  }

  async lookupRealEstate(): Promise<LicenseSnapshot | null> {
    return null;
  }
}
