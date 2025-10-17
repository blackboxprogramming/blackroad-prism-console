# BlackRoad Finance Compliance Prompt Library

This collection captures Codex-ready prompts to generate compliance scaffolding across BlackRoad Finance's advisory and broker-dealer programs. Each prompt encodes the cited regulatory mechanics from Series 66/7/24 study material so engineering teams can transform the outputs into policies, workflows, or code modules.

## 1. RIA Registration & Scope

```
Generate a compliance checklist and Form ADV data model for a U.S. Registered Investment Adviser (RIA), with logic to decide “federal covered” vs. “state-registered” based on AUM thresholds and advisory relationships to registered investment companies. Include Exempt Reporting Adviser (ERA) handling. For each branch, output required filings (SEC IARD vs. state), renewal cadence, and public-facing disclosures. Do not infer that an adviser becomes “federal covered” just for advising on exchange-listed securities—base it on AUM or managing a ’40-Act fund.

Sources to encode: NSMIA registration split and thresholds; who is a federal covered adviser; ERA electronic reporting via IARD.
```

## 2. Personnel Onboarding: IARs, Registered Reps, and Principals

```
Build an onboarding workflow for employees with roles: Investment Adviser Representative (IAR), Broker-Dealer Registered Rep, and Principal.
– Collect and validate Form U-4 fields (10-year employment, 5-year residences, regulatory actions, criminal disclosures—even if reduced/dismissed).
– Require original signatures and background checks; auto-create ticklers: U4 amendments within 30 days (10 business days if SD-related), CE windows, and requalification gates (30/180-day test retakes).
– Flag clerical-only workers as non-registrants.
– Enforce “no license parking”; 2-year window for re-association without exam.
Encode these requirements and outputs (docs, reminders, adverse-action branch).

Sources to encode: U-4 content & signatures; clerical exception; amendment timelines; retest intervals; 2-year jurisdiction/return rules.
```

### Principal-Specific Routing

```
Add routing logic to require principal registrations for managers (e.g., Series 24 for general securities supervision). If a rep is assigned supervisory duties, force principal registration within 90 days or block assignment.

Source: principal definition and 90-day upgrade to principal.
```

## 3. AML/KYC for All Assets (Extendable to Crypto)

```
Generate an AML program template (policy plus JSON schema) with:
– Firm-wide AML officer designation & FCS contact, senior-management approval, independent annual (or biannual, if eligible) testing, training plan.
– CTR logic (currency >$10,000 in one day; file within 15 days) and recordkeeping (5 years).
– SAR logic (≥$5,000 suspicious), confidentiality, 30-day filing clock, 5-year retention.
– Funds-transfer recordkeeping for wires ≥$3,000.
– Red-flag library (structuring; atypical cash behavior; multiple accounts & third-party wires; risk-indifferent trading), staged across placement/layering/integration.
Make control points data-driven so they can plug into fiat, securities, and digital-asset rails the same way.

Sources to encode: AML program elements & FCS contact; CTR/SAR thresholds & timelines; wire recordkeeping; laundering stages & red flags.
```

## 4. Advertising & Fund Marketing Controls

```
Create an advertising pre-review pipeline that:
– Blocks use of “omitting prospectus” claims unless the content is traceable to the statutory prospectus, provides conspicuous “get a prospectus” language, urges reading, and includes performance disclaimers; also blocks any purchase functionality (Rule 482).
– For IPOs, enforces cooling-off rules: no orders or sales literature until effective; permit only red herrings, indications of interest, and tombstones; deliver final prospectus at sale/confirm.
Output: validation rules, examples, and rejection reasons.

Sources to encode: Rule 482 conditions; cooling-off do’s/don’ts; final prospectus delivery.
```

## 5. Mutual Fund Pricing, Breakpoints, and Fee Credits

```
Implement point-of-sale checks for mutual fund transactions:
– Enforce “at POP” unless valid breakpoint rights apply; support automatic breakpoint aggregation (eligible households/entities) and DRIP no-load handling.
– Permit fee credits against advisory fees using commissions earned, but do not rebate or discount mutual-fund offering-price commissions directly.
Output warnings where transactions fall just below breakpoints.

Sources to encode: sale at POP; valid breakpoint groupings; DRIP no-load; fee-credit vs. prohibited commission rebates.
```

## 6. Broker-Dealer Affiliation: U4/U5, Suitability, and Testing

```
For the broker-dealer side, add flows to:
– Validate U4 data, store originals, keep 3-year post-termination records, verify 3-year employer references, and auto-generate U5 on termination (+amendments when new facts arise).
– Enforce CE (Regulatory Element 120-day window) and re-test intervals (30/180-day gates).
– Output Investigator mode: no marital/education fields should be requested in U4.

Sources to encode: U4 content, records, background, amendment timelines; U5 amendment duty; CE windows.
```

## 7. Market-Abuse Guardrails

```
Generate a surveillance spec for insider-trading and manipulation red flags integrated with AML (wash/matched trades; odd price-insensitive activity; patterns indicative of layering). Include escalation paths to Compliance (SAR vs. no-SAR), blocked terms in research/ads before an effective date, and retention periods.

(Map this to whatever order-book or on-chain analytics you add for crypto later.)
```

## 8. Offering Process Controls

```
Build a workflow engine for new offerings that:
– Recognizes preliminary vs. final prospectuses; rejects any “marked-up” red herrings and prevents acceptance of customer funds before effectiveness.
– On effectiveness, triggers final prospectus delivery alongside confirms.

Sources to encode: no marks on red herring; unlawful sales pre-effective; post-effective delivery.
```

## 9. Product Shelf & Custody Notes

```
Build a product taxonomy with flags for: security vs. non-security (e.g., precious metals are not securities), pooled vehicles (’40-Act), and custody requirements (e.g., registered investment companies require a qualified custodian bank or exchange member-BD; “affiliated person” & control tests).

Sources to encode: precious metals not securities; custodian requirement; control thresholds.
```

## 10. DigitalAsset_Risk Add-On Module

```
Using the same AML/KYC thresholds and red-flag patterns already implemented (CTR/SAR/wire rules and structuring indicators), create an add-on policy module called DigitalAsset_Risk. It should:
– Treat fiat on/off-ramps and wallet movements like wires/cash equivalents for monitoring.
– Require source-of-funds checks in placement stage; traceability checks in layering stage; and fiat reconciling in integration stage.
– Reuse SAR confidentiality and 30-day timing; keep 5-year records.

(Tie this module to the general thresholds already encoded.)

Sources to honor: CTR/SAR/wire thresholds, confidentiality, and stages.
```

## Implementation Notes for Engineers

- Rule 482 checks must block “buy now” CTAs and require “get a prospectus” language and disclaimers in any fund ads pulled from the statutory prospectus.
- Cooling-off: no orders or sales literature; only red herrings, indications of interest, and tombstones; deliver final prospectus on or with confirmation.
- AML thresholds to hardcode: CTR > $10,000 (15-day filing, 5-year retention), SAR ≥ $5,000 suspicious (30-day filing, confidentiality, 5-year retention), wires ≥ $3,000 recordkeeping with placement/layering/integration red flags.
- U4 essentials: 10-year employment, 5-year residences, original signatures, 30-day amendments (10 business days if statutory disqualification), 30/180-day exam retest gates; do not collect marital or education data.
```
