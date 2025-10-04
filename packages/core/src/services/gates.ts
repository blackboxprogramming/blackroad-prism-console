import { InMemoryStore } from "./store.js";
import type { GateAction } from "@blackroad/db";
import { PolicyEngine } from "./policy-engine.js";
import type { GateEvaluationResult } from "../types.js";

export class GateService {
  constructor(private readonly store: InMemoryStore, private readonly policies: PolicyEngine) {}

  evaluate(clientId: string, action: GateAction): GateEvaluationResult {
    const existing = this.store.getGate(clientId, action);
    if (existing) {
      return { allowed: existing.allowed, reason: existing.reason };
    }

    const gate = this.runEvaluation(clientId, action);
    this.store.createGate({ clientId, action, allowed: gate.allowed, reason: gate.reason });
    return gate;
  }

  private runEvaluation(clientId: string, action: GateAction): GateEvaluationResult {
    const client = this.store.requireClient(clientId);
    const accountApp = [...this.store.accountApps.values()].find((app) => app.clientId === clientId);
    const documents = this.store.listClientDocuments(clientId);
    const screenings = this.store.listClientScreenings(clientId);
    const wallets = this.store.listClientWallets(clientId);

    if (action === "advise") {
      const kycResult = this.policies.evaluateKyc(clientId);
      if (!kycResult.pass) {
        return { allowed: false, reason: kycResult.breaches.join(",") };
      }
      if (screenings.some((screening) => screening.status === "HIT")) {
        return { allowed: false, reason: "screening.hit" };
      }
      if (!documents.some((doc) => doc.kind === "FORM_CRS")) {
        return { allowed: false, reason: "docs.form_crs_missing" };
      }
      return { allowed: true };
    }

    if (action === "open_account") {
      const adviseGate = this.evaluate(clientId, "advise");
      if (!adviseGate.allowed) {
        return { allowed: false, reason: "advise_gate_blocked" };
      }
      if (!documents.some((doc) => doc.kind === "CUSTODY_PACKET")) {
        return { allowed: false, reason: "custody_packet_missing" };
      }
      return { allowed: true };
    }

    if (action === "trade") {
      if (!accountApp || accountApp.status !== "Opened") {
        return { allowed: false, reason: "account_not_open" };
      }
      if (screenings.some((screening) => screening.status === "HIT")) {
        return { allowed: false, reason: "screening.hit" };
      }
      return { allowed: true };
    }

    if (action === "enable_options") {
      if (!accountApp) return { allowed: false, reason: "no_account" };
      const suitability = client.suitability as { score?: number; optionsLevel?: number };
      const requestedLevel = accountApp.optionsLevel ?? 0;
      if ((suitability.optionsLevel ?? Math.floor((suitability.score ?? 0) / 25)) < requestedLevel) {
        return { allowed: false, reason: "options.level_insufficient" };
      }
      if (!documents.some((doc) => doc.kind === "OPTIONS_AGR")) {
        return { allowed: false, reason: "options_agreement_missing" };
      }
      return { allowed: true };
    }

    if (action === "enable_margin") {
      const suitability = client.suitability as { score?: number };
      if ((suitability.score ?? 0) < 60) {
        return { allowed: false, reason: "margin.insufficient_risk" };
      }
      if (!documents.some((doc) => doc.kind === "MARGIN_AGR")) {
        return { allowed: false, reason: "margin_agreement_missing" };
      }
      return { allowed: true };
    }

    if (action === "enable_crypto") {
      const cryptoDisclosure = documents.some((doc) => doc.kind === "CRYPTO_RISK");
      if (!cryptoDisclosure) {
        return { allowed: false, reason: "crypto.disclosure_missing" };
      }
      if (wallets.some((wallet) => (wallet.riskScore ?? 0) > 80 || wallet.status !== "VERIFIED")) {
        return { allowed: false, reason: "crypto.wallet_blocked" };
      }
      return { allowed: true };
    }

    return { allowed: false, reason: "unsupported_gate" };
  }
}
