import { describe, expect, it } from "vitest";
import {
  evaluateRulebook,
  planReinstatement,
  planToMarkdown,
  canTradeBDIn,
  validateTaskCompletion,
} from "../src/index.js";
import type {
  Person,
  LicenseTrack,
  Rulebook,
  PlanOptions,
} from "../src/types.js";

const basePerson: Person = {
  id: "person-1",
  legalName: "Alexa Louise Amundson",
  aka: ["Alexa Amundson"],
  crdNumber: "7794541",
  homeState: "MN",
  tracks: ["securities", "insurance", "real_estate"],
  targetStates: ["MN", "WI"],
  disclosures: [],
  designations: [],
  priorEmployers: [{ name: "Securian", role: "Registered Rep" }],
};

const insuranceRulebook: Rulebook = {
  id: "mn-insurance-life",
  stateCode: "MN",
  track: "insurance",
  licenseType: "Producer:Life/Health",
  version: 1,
  sourceUrls: ["https://mn.gov/commerce/licensees/insurance/license-renewal.jsp"],
  rules: {
    graceWindowDays: 0,
    reinstatementWindowDays: 365,
    requiresExamRetakeIfBeyondDays: 365,
    requiresPrelicensingIfBeyondDays: undefined,
    ce: { requiredHours: 24, ethicsHours: 3, carryover: false },
    backgroundCheck: null,
    sponsorRequired: false,
    formSet: ["Sircon"],
    fees: null,
    appointmentsResetOnReinstatement: true,
    docsNeeded: ["PhotoID", "CECert"],
    transitions: [
      {
        from: "Expired",
        to: "Active",
        conditions: ["Within 12 months"],
        tasks: ["INSURANCE_REINSTATE_VIA_SIRCON", "PAY_REINSTATEMENT_FEE"],
      },
      {
        from: "Expired",
        to: "Requalify",
        conditions: [">12 months"],
        tasks: ["NEW_APPLICATION", "SCHEDULE_INSURANCE_EXAM"],
      },
    ],
  },
};

const planOptions: PlanOptions = {
  targetStates: ["MN"],
  targetTracks: ["insurance"],
};

describe("rule evaluation", () => {
  it("returns Active path for 300 days since expiration", () => {
    const track: LicenseTrack = {
      id: "track-1",
      personId: basePerson.id,
      track: "insurance",
      stateCode: "MN",
      licenseType: "Producer:Life/Health",
      status: "Expired",
      expiration: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
      ceHoursEarned: 24,
    };
    const result = evaluateRulebook({
      personId: basePerson.id,
      licenseTrack: track,
      rulebook: insuranceRulebook,
      now: new Date(),
    });
    expect(result.target).toBe("Active");
  });

  it("returns Requalify path for 400 days since expiration", () => {
    const track: LicenseTrack = {
      id: "track-1",
      personId: basePerson.id,
      track: "insurance",
      stateCode: "MN",
      licenseType: "Producer:Life/Health",
      status: "Expired",
      expiration: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      ceHoursEarned: 24,
    };
    const result = evaluateRulebook({
      personId: basePerson.id,
      licenseTrack: track,
      rulebook: insuranceRulebook,
      now: new Date(),
    });
    expect(result.target).toBe("Requalify");
  });
});

describe("gate checks", () => {
  it("blocks broker-dealer activity when sponsor missing", () => {
    const track: LicenseTrack = {
      id: "track-bd",
      personId: basePerson.id,
      track: "securities",
      stateCode: "MN",
      licenseType: "BrokerDealer:Representative",
      status: "Active",
      metadata: {},
    };
    const result = canTradeBDIn("MN", {
      person: basePerson,
      licenseTracks: [track],
      rulebooks: [],
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("sponsor");
  });
});

describe("planner idempotency", () => {
  it("does not duplicate tasks when planning twice", () => {
    const track: LicenseTrack = {
      id: "track-1",
      personId: basePerson.id,
      track: "insurance",
      stateCode: "MN",
      licenseType: "Producer:Life/Health",
      status: "Expired",
      expiration: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
      ceHoursEarned: 20,
    };
    const firstPlan = planReinstatement({
      person: basePerson,
      licenseTracks: [track],
      rulebooks: [insuranceRulebook],
      options: planOptions,
    });
    const secondPlan = planReinstatement({
      person: basePerson,
      licenseTracks: [track],
      rulebooks: [insuranceRulebook],
      options: planOptions,
    });
    expect(firstPlan.tasks.length).toBe(secondPlan.tasks.length);
    // Markdown summary should include only one CE task
    const markdown = planToMarkdown(secondPlan.summaries);
    const ceOccurrences = markdown.match(/Upload CE certificates/g) ?? [];
    expect(ceOccurrences.length).toBe(1);
  });
});

describe("artifact enforcement", () => {
  it("throws when completing FILE_U4 without required artifact", () => {
    expect(() => validateTaskCompletion("FILE_U4", [])).toThrowError();
  });
});
