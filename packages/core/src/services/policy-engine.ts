import type { Wallet } from "@blackroad/db";
import { kyc, suitability } from "@blackroad/policies";
import type { InMemoryStore } from "./store.js";

export class PolicyEngine {
  constructor(private readonly store: InMemoryStore) {}

  evaluateKyc(clientId: string): ReturnType<typeof kyc.core> {
    const persons = this.store.listClientPersons(clientId);
    const subjects = persons.map((person) => ({
      id: person.id,
      role: person.role,
      name: person.name,
      pep: person.pep,
      sanctionsHit: person.sanctionsHit,
      kycProfile: {
        documents: (person.kyc?.documents as { type: string; verified: boolean }[]) ?? [],
        addressVerified: Boolean(person.kyc?.addressVerified),
        lastVerifiedAt: person.kyc?.lastVerifiedAt as string | undefined,
      },
    }));

    return kyc.core({
      subjects,
      addressVerificationRequired: true,
    });
  }

  evaluateCryptoSuitability(clientId: string, options: {
    riskTolerance: "Low" | "Moderate" | "High" | "Speculative";
    experienceYears: number;
    objectives: string[];
    incomeStability: "Low" | "Medium" | "High";
    drawdownComfort: "Low" | "Medium" | "High";
    walletIds?: string[];
  }): ReturnType<typeof suitability.crypto> {
    const wallets: Wallet[] = options.walletIds
      ? options.walletIds.map((id) => this.store.requireWallet(id))
      : this.store.listClientWallets(clientId);
    return suitability.crypto({
      questionnaire: {
        riskTolerance: options.riskTolerance,
        experienceYears: options.experienceYears,
        objectives: options.objectives,
        incomeStability: options.incomeStability,
        drawdownComfort: options.drawdownComfort,
      },
      wallets: wallets.map((wallet) => ({
        walletId: wallet.id,
        riskScore: wallet.riskScore ?? 0,
        ownershipVerified: wallet.status === "VERIFIED",
        tags: [],
      })),
    });
  }
}
