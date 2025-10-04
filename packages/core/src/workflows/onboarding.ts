import { nanoid } from "nanoid";
import type { AccountApp, Client, Person } from "@blackroad/db";
import type { StartOnboardingInput, StartOnboardingResult } from "../types.js";
import { InMemoryStore } from "../services/store.js";
import { PolicyEngine } from "../services/policy-engine.js";
import { DocumentService } from "../services/document-service.js";
import * as walletIntegration from "@blackroad/integrations";
import { append, InMemoryWormAdapter } from "@blackroad/worm";
import type { SuitabilityInput, SuitabilitySummary } from "../types.js";

export class ClientOnboardingEngine {
  readonly store: InMemoryStore;
  readonly policies: PolicyEngine;
  readonly documents: DocumentService;
  readonly worm: InMemoryWormAdapter;

  constructor(store?: InMemoryStore) {
    this.store = store ?? new InMemoryStore();
    this.policies = new PolicyEngine(this.store);
    this.documents = new DocumentService(this.store);
    this.worm = new InMemoryWormAdapter();
  }

  async start(input: StartOnboardingInput): Promise<StartOnboardingResult> {
    const client: Client = this.store.createClient({
      id: nanoid(),
      type: input.type,
      status: "Prospect",
      suitability: {},
      riskBand: undefined,
      createdAt: new Date(),
    });

    const accountApp: AccountApp = this.store.createAccountApp({
      id: nanoid(),
      clientId: client.id,
      channel: input.channel,
      accountType: input.accountType,
      optionsLevel: 0,
      margin: false,
      objectives: [],
      timeHorizon: "Medium",
      liquidityNeeds: "Moderate",
      riskTolerance: "Moderate",
      disclosuresAccepted: [],
      eSignEnvelopeId: undefined,
      status: "Draft",
      meta: {},
    });

    const checklist = this.buildChecklist(input.type, input.channel);
    await append(this.worm, { type: "ONBOARDING_START", clientId: client.id, accountAppId: accountApp.id });
    return { client, accountApp, checklist };
  }

  createPerson(input: { clientId: string; role: Person["role"]; name: string }): Person {
    const person = this.store.createPerson({
      id: nanoid(),
      clientId: input.clientId,
      role: input.role,
      name: input.name,
      kyc: { documents: [], addressVerified: false },
      addresses: {},
      emails: [],
      phones: [],
      pep: false,
      sanctionsHit: false,
    });
    return person;
  }

  async runKyc(clientId: string) {
    const result = this.policies.evaluateKyc(clientId);
    await append(this.worm, { type: "KYC_RESULT", clientId, result });
    return result;
  }

  async addWallet(clientId: string, chain: string, address: string, label?: string) {
    const screening = walletIntegration.screen(chain, address);
    const wallet = this.store.createWallet({
      clientId,
      chain: chain as any,
      address,
      label,
      riskScore: screening.riskScore,
      lastScreenedAt: new Date(),
      status: screening.riskScore > 80 ? "RESTRICTED" : "VERIFIED",
    });
    this.store.createScreening({
      clientId,
      subjectType: "WALLET",
      subjectId: wallet.id,
      provider: "CHAIN_STUB",
      result: screening,
      score: screening.riskScore,
      status: screening.riskScore > 80 ? "HIT" : screening.riskScore > 60 ? "REVIEW" : "CLEAR",
    });
    await append(this.worm, { type: "WALLET_SCREEN", clientId, walletId: wallet.id, screening });
    return wallet;
  }

  async scoreSuitability(input: SuitabilityInput): Promise<SuitabilitySummary> {
    const client = this.store.requireClient(input.clientId);
    const score =
      (input.riskTolerance === "Speculative"
        ? 85
        : input.riskTolerance === "High"
        ? 70
        : input.riskTolerance === "Moderate"
        ? 50
        : 30) +
      Math.min(input.experienceYears * 5, 20);
    const band: Client["riskBand"] = score >= 80 ? "SPECULATIVE" : score >= 60 ? "HIGH" : score >= 40 ? "MODERATE" : "LOW";

    let cryptoRiskBand: SuitabilitySummary["cryptoRiskBand"];
    if (input.crypto) {
      const cryptoResult = this.policies.evaluateCryptoSuitability(input.clientId, {
        riskTolerance: input.riskTolerance,
        experienceYears: input.experienceYears,
        objectives: input.objectives,
        incomeStability: (input.questionnaire.incomeStability as "Low" | "Medium" | "High") ?? "Medium",
        drawdownComfort: (input.questionnaire.drawdownComfort as "Low" | "Medium" | "High") ?? "Medium",
        walletIds: input.walletIds,
      });
      cryptoRiskBand = cryptoResult.cryptoRiskBand;
      if (!cryptoResult.pass) {
        await append(this.worm, { type: "CRYPTO_SUITABILITY_FAIL", clientId: input.clientId, cryptoResult });
      }
    }

    const summary: SuitabilitySummary = {
      score,
      band: band ?? "LOW",
      cryptoRiskBand,
      notes: input.objectives,
      questionnaire: input.questionnaire,
    };

    this.store.updateClient(client.id, {
      suitability: summary,
      riskBand: summary.band,
    });
    await append(this.worm, { type: "SUITABILITY_SCORED", clientId: client.id, summary });
    return summary;
  }

  generateDocuments(accountAppId: string, sets: string[]) {
    const accountApp = this.store.requireAccountApp(accountAppId);
    const docs = this.documents.generateForAccount(accountApp, sets);
    append(this.worm, { type: "DOCS_GENERATED", accountAppId, docs: docs.map((doc) => doc.kind) });
    return docs;
  }

  recordEnvelope(accountAppId: string, envelopeId: string) {
    this.store.updateAccountApp(accountAppId, { eSignEnvelopeId: envelopeId, status: "NeedsReview" });
  }

  markAccountAppStatus(accountAppId: string, status: AccountApp["status"]) {
    this.store.updateAccountApp(accountAppId, { status });
  }

  buildChecklist(type: Client["type"], channel: AccountApp["channel"]): string[] {
    const base = ["Government ID", "Address Proof"];
    if (type !== "INDIVIDUAL") {
      base.push("Formation Documents", "Ownership Chart");
    }
    if (channel === "CRYPTO") {
      base.push("Crypto Risk Disclosure", "Wallet Attestation");
    }
    return base;
  }
}
