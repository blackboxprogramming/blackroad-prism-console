import { nanoid } from "nanoid";

export interface SanctionsSearchPersonInput {
  id?: string;
  name: string;
  country?: string;
}

export interface SanctionsSearchResult {
  reference: string;
  score: number;
  status: "CLEAR" | "HIT" | "REVIEW";
  notes?: string;
}

export function searchPerson(input: SanctionsSearchPersonInput): SanctionsSearchResult {
  const normalized = input.name.toLowerCase();
  if (normalized.includes("hit")) {
    return {
      reference: nanoid(8),
      score: 95,
      status: "HIT",
      notes: "Matched on name keyword",
    };
  }
  if (normalized.includes("review")) {
    return {
      reference: nanoid(8),
      score: 60,
      status: "REVIEW",
      notes: "Fuzzy match triggered manual review",
    };
  }
  return {
    reference: nanoid(8),
    score: 5,
    status: "CLEAR",
  };
}

export function searchBusiness(input: { legalName: string }): SanctionsSearchResult {
  return searchPerson({ name: input.legalName });
}
