import { describe, it, expect } from "vitest";
import { ScenarioEngine, detectFrontRunning, detectMixerProximity, detectWashTrades } from "../src/surveillance/scenarios/index.js";
import { scanCommunications, seedLexicons } from "../src/surveillance/lexicon/index.js";
import { InsiderListService } from "../src/surveillance/insider/index.js";
import { CaseService } from "../src/surveillance/cases/index.js";
import { SuppressionService, AlertDeduper } from "../src/surveillance/suppression/index.js";
import { RetentionService } from "../src/surveillance/retention/index.js";
import { InMemoryWormLedger, verifyChain } from "../../worm/src/index.js";

describe("Scenario engine", () => {
  const baseContext = { trades: [], walletTransfers: [] };

  it("detects wash trades for same account within 5 minutes", async () => {
    const engine = new ScenarioEngine();
    const now = new Date();
    const alerts = await engine.run({
      ...baseContext,
      trades: [
        {
          id: "t1",
          accountId: "A1",
          householdId: "H1",
          repId: "R1",
          symbol: "BRF",
          assetType: "EQUITY",
          side: "BUY",
          quantity: 500,
          price: 10,
          executedAt: now,
        },
        {
          id: "t2",
          accountId: "A1",
          householdId: "H1",
          repId: "R1",
          symbol: "BRF",
          assetType: "EQUITY",
          side: "SELL",
          quantity: 500,
          price: 10.1,
          executedAt: new Date(now.getTime() + 2 * 60 * 1000),
        },
      ],
      walletTransfers: [],
    });
    const washAlert = alerts.find((alert) => alert.scenario === "WASH_TRADE");
    expect(washAlert).toBeDefined();
    expect(washAlert?.signal.symbol).toBe("BRF");
  });

  it("detects front running when rep trades before client", async () => {
    const engine = new ScenarioEngine([{ name: "FRONT_RUN", detect: detectFrontRunning }]);
    const now = new Date();
    const alerts = await engine.run({
      ...baseContext,
      trades: [
        {
          id: "p1",
          accountId: "EMP123",
          repId: "R1",
          symbol: "ALP",
          assetType: "EQUITY",
          side: "BUY",
          quantity: 200,
          price: 30,
          executedAt: now,
          isEmployeeAccount: true,
        },
        {
          id: "c1",
          accountId: "CLIENT1",
          repId: "R1",
          symbol: "ALP",
          assetType: "EQUITY",
          side: "BUY",
          quantity: 500,
          price: 31,
          executedAt: new Date(now.getTime() + 2 * 60 * 1000),
          isEmployeeAccount: false,
        },
      ],
      walletTransfers: [],
    });
    const frontRun = alerts.find((alert) => alert.scenario === "FRONT_RUN");
    expect(frontRun).toBeDefined();
    expect(frontRun?.signal.repId).toBe("R1");
  });

  it("flags mixer proximity when wallet is within 2 hops", async () => {
    const now = new Date();
    const engine = new ScenarioEngine([{ name: "MIXER_PROXIMITY", detect: detectMixerProximity }]);
    const alerts = await engine.run({
      ...baseContext,
      trades: [],
      walletTransfers: [
        {
          id: "w1",
          wallet: "0xabc",
          asset: "USDC",
          direction: "IN",
          amount: 12000,
          txHash: "0x123",
          timestamp: now,
          screeningPath: [
            { address: "0xmix", tag: "Mixer Hub", riskLevel: "SEVERE", distance: 2 },
            { address: "0xofac", tag: "Sanctioned", riskLevel: "SEVERE", distance: 3 },
          ],
        },
      ],
    });
    const mixer = alerts.find((alert) => alert.scenario === "MIXER_PROXIMITY");
    expect(mixer).toBeDefined();
    expect(mixer?.signal.closest.distance).toBe(2);
  });
});

describe("Lexicon engine", () => {
  it("creates comm alerts for promissory and off-channel phrases", () => {
    const comms = [
      {
        id: "c1",
        channel: "EMAIL" as const,
        from: "advisor@blackroad",
        to: ["client@x"],
        ts: new Date(),
        text: "We guarantee a 10% return if you wire today.",
      },
      {
        id: "c2",
        channel: "IM" as const,
        from: "advisor@blackroad",
        to: ["client@x"],
        ts: new Date(),
        text: "Let's text me on WhatsApp to discuss details.",
      },
    ];
    const { alerts } = scanCommunications(comms, seedLexicons);
    const promissory = alerts.find((alert) => alert.scenario === "PROMISSORY_LANGUAGE");
    const offChannel = alerts.find((alert) => alert.scenario === "OFF_CHANNEL_COMMS");
    expect(promissory).toBeDefined();
    expect(promissory?.severity).toBeGreaterThan(70);
    expect(offChannel).toBeDefined();
    expect(offChannel?.signal.snippet.toLowerCase()).toContain("whatsapp");
  });
});

describe("Insider enforcement", () => {
  it("blocks trades against restricted list and emits alert", () => {
    const ledger = new InMemoryWormLedger();
    const insiders = new InsiderListService(ledger);
    const issuer = insiders.addIssuer({
      symbol: "BRX",
      name: "Borealis Rx",
      event: "EARNINGS",
      windowStart: new Date(Date.now() - 60 * 60 * 1000),
      windowEnd: new Date(Date.now() + 60 * 60 * 1000),
      restrictedList: true,
    });
    insiders.addPerson({ personId: "advisor-1", issuerId: issuer.id, wallCrossedAt: new Date(Date.now() - 30 * 60 * 1000) });

    const assessment = insiders.assessTrade(
      {
        id: "t1",
        accountId: "ACCT-1",
        repId: "advisor-1",
        symbol: "BRX",
        assetType: "EQUITY",
        side: "BUY",
        quantity: 100,
        price: 15,
        executedAt: new Date(),
      },
      "advisor-1"
    );

    expect(assessment.allowed).toBe(false);
    expect(assessment.alerts[0].scenario).toBe("INSIDER_WINDOW_BREACH");
    expect(assessment.alerts[0].severity).toBeGreaterThanOrEqual(90);
  });
});

describe("Case workflow", () => {
  it("creates case, tracks notes, and verifies WORM chain", () => {
    const ledger = new InMemoryWormLedger();
    const cases = new CaseService(ledger);
    const alertA = {
      id: "a1",
      kind: "CRYPTO" as const,
      scenario: "MIXER_PROXIMITY",
      severity: 88,
      status: "Open" as const,
      key: "wallet|0xabc",
      signal: { wallet: "0xabc" },
      createdAt: new Date(),
    };
    const alertB = { ...alertA, id: "a2", signal: { wallet: "0xdef" } };

    const caseRecord = cases.ingestAlert(alertA);
    const sameCase = cases.ingestAlert(alertB);
    expect(caseRecord.id).toBe(sameCase.id);

    const note = cases.addNote(caseRecord.id, { authorId: "alexa", body: "Investigating wallets." });
    expect(note.meta.body).toContain("Investigating");

    const doc = cases.attachDocument(caseRecord.id, "doc-1", { sha256: "abc" });
    expect(doc.refId).toBe("doc-1");

    const closed = cases.closeCase({
      caseId: caseRecord.id,
      status: "Closed_Remediation",
      summary: "Wallets escalated",
      disposition: "Remediation",
      closedBy: "alexa",
    });
    expect(closed.status).toBe("Closed_Remediation");

    const chain = ledger.all();
    const verification = verifyChain(chain);
    expect(verification.valid).toBe(true);
  });
});

describe("Suppression", () => {
  it("suppresses repeat alerts and respects expiration", () => {
    const ledger = new InMemoryWormLedger();
    const suppression = new SuppressionService(ledger);
    const deduper = new AlertDeduper();

    suppression.addRule({
      scenario: "MIXER_PROXIMITY",
      keyPattern: "wallet|0xabc",
      reason: "Known mixer investigation",
      createdBy: "alexa",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const alert = {
      id: "a1",
      kind: "CRYPTO" as const,
      scenario: "MIXER_PROXIMITY",
      severity: 80,
      status: "Open" as const,
      key: "wallet|0xabc",
      signal: { wallet: "0xabc" },
      createdAt: new Date(),
    };

    expect(suppression.shouldSuppress(alert)).toBe(true);

    const deduped = deduper.filter([alert, alert]);
    expect(deduped.length).toBe(1);
  });
});

describe("Retention", () => {
  it("archives, expires, and purges comms with WORM logs", () => {
    const ledger = new InMemoryWormLedger();
    const retention = new RetentionService(ledger);
    retention.setPolicy({ retentionKey: "email_standard", days: 1 });

    const comm = {
      id: "comm-1",
      channel: "EMAIL" as const,
      from: "advisor@blackroad",
      to: ["client@x"],
      ts: new Date(),
      text: "Proposal",
    };

    const archived = retention.archive(comm, "email_standard");
    expect(archived.archived).toBe(true);

    const expireAt = new Date(archived.expiresAt.getTime() + 60 * 60 * 1000);
    const expired = retention.markExpired(expireAt);
    expect(expired).toHaveLength(1);

    const purged = retention.purgeExpired();
    expect(purged).toHaveLength(1);

    const chain = ledger.all();
    const verification = verifyChain(chain);
    expect(verification.valid).toBe(true);
  });
});
