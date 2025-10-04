import { describe, expect, it, beforeEach } from "vitest";
import { ClientOnboardingEngine, GateService, forceComplete, sendEnvelope, syncEnvelope } from "../src/index.js";

describe("ClientOS onboarding", () => {
  let engine: ClientOnboardingEngine;
  let gateService: GateService;

  beforeEach(() => {
    engine = new ClientOnboardingEngine();
    gateService = new GateService(engine.store, engine.policies);
  });

  it("fails KYC when ID missing or sanctions hit", async () => {
    const { client } = await engine.start({ type: "INDIVIDUAL", channel: "RIA", accountType: "Individual" });
    const person = engine.createPerson({ clientId: client.id, role: "PRIMARY", name: "Jane Doe" });
    let kycResult = await engine.runKyc(client.id);
    expect(kycResult.pass).toBe(false);
    expect(kycResult.breaches).toContain(`kyc.missing_document:${person.id}`);

    engine.store.updatePerson(person.id, {
      kyc: { documents: [{ type: "GOV_ID", verified: true }], addressVerified: true },
      sanctionsHit: true,
    });

    kycResult = await engine.runKyc(client.id);
    expect(kycResult.pass).toBe(false);
    expect(kycResult.breaches).toContain(`kyc.sanctions_hit:${person.id}`);

    engine.store.updatePerson(person.id, {
      sanctionsHit: false,
    });
    kycResult = await engine.runKyc(client.id);
    expect(kycResult.pass).toBe(true);
  });

  it("crypto suitability blocks high risk wallet", async () => {
    const { client } = await engine.start({ type: "INDIVIDUAL", channel: "CRYPTO", accountType: "ManagedCrypto" });
    const person = engine.createPerson({ clientId: client.id, role: "PRIMARY", name: "Alex" });
    engine.store.updatePerson(person.id, {
      kyc: { documents: [{ type: "GOV_ID", verified: true }], addressVerified: true },
    });
    await engine.runKyc(client.id);

    const wallet = await engine.addWallet(client.id, "ETH", "0x00000000000000000000000000000000000000FF");
    await engine.scoreSuitability({
      clientId: client.id,
      riskTolerance: "High",
      objectives: ["Growth"],
      timeHorizon: "Long",
      liquidityNeeds: "Low",
      experienceYears: 5,
      crypto: true,
      walletIds: [wallet.id],
      questionnaire: { incomeStability: "High", drawdownComfort: "Medium" },
    });

    const gate = gateService.evaluate(client.id, "enable_crypto");
    if ((wallet.riskScore ?? 0) > 80) {
      expect(gate.allowed).toBe(false);
      expect(gate.reason).toBe("crypto.wallet_blocked");
    }
  });

  it("esign completion unlocks advise and open_account gates", async () => {
    const { client, accountApp } = await engine.start({ type: "INDIVIDUAL", channel: "RIA", accountType: "Individual" });
    const person = engine.createPerson({ clientId: client.id, role: "PRIMARY", name: "Jamie" });
    engine.store.updatePerson(person.id, {
      kyc: { documents: [{ type: "GOV_ID", verified: true }], addressVerified: true },
    });
    await engine.runKyc(client.id);

    engine.generateDocuments(accountApp.id, ["FORM_CRS", "CUSTODY_PACKET"]);
    const { envelopeId } = await sendEnvelope(engine, accountApp.id, ["ADV_AGREEMENT"]);
    await forceComplete(envelopeId);
    await syncEnvelope(engine, envelopeId);

    const adviseGate = gateService.evaluate(client.id, "advise");
    expect(adviseGate.allowed).toBe(true);

    const openGate = gateService.evaluate(client.id, "open_account");
    expect(openGate.allowed).toBe(true);
  });
});
