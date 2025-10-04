export interface PolicyResult {
  pass: boolean;
  breaches: string[];
  risk: number;
  recommendations?: string[];
}

export interface KycDocument {
  type: string;
  verified: boolean;
  issuedCountry?: string;
}

export interface PersonKycProfile {
  documents: KycDocument[];
  addressVerified: boolean;
  lastVerifiedAt?: string;
}

export interface KycSubject {
  id: string;
  role: string;
  name: string;
  pep?: boolean;
  sanctionsHit?: boolean;
  kycProfile: PersonKycProfile;
}

export interface KycContext {
  subjects: KycSubject[];
  addressVerificationRequired?: boolean;
}

export interface CryptoQuestionnaire {
  riskTolerance: "Low" | "Moderate" | "High" | "Speculative";
  experienceYears: number;
  objectives: string[];
  incomeStability: "Low" | "Medium" | "High";
  drawdownComfort: "Low" | "Medium" | "High";
}

export interface CryptoWalletInsight {
  walletId: string;
  riskScore: number;
  ownershipVerified: boolean;
  tags: string[];
}

export interface CryptoSuitabilityContext {
  questionnaire: CryptoQuestionnaire;
  wallets: CryptoWalletInsight[];
}

export interface CryptoSuitabilityResult extends PolicyResult {
  cryptoRiskBand: "LOW" | "MODERATE" | "HIGH" | "SPECULATIVE";
}
