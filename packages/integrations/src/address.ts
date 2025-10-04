export interface AddressInput {
  line1: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface AddressVerificationResult {
  verified: boolean;
  dpv: boolean;
  notes?: string;
}

export function verify(address: AddressInput): AddressVerificationResult {
  const isDomestic = address.country.toUpperCase() === "US";
  if (!address.postalCode && isDomestic) {
    return { verified: false, dpv: false, notes: "Missing postal code" };
  }
  if (!address.line1.trim()) {
    return { verified: false, dpv: false, notes: "Address line 1 required" };
  }
  return { verified: true, dpv: isDomestic };
}
