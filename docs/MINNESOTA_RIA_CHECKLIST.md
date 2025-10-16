# Minnesota RIA Launch Checklist

> This checklist is a working scaffold for launching BlackRoad as a registered investment adviser (RIA) in Minnesota. Treat it as a coordination aid—not legal advice—and confirm every step with qualified compliance and legal professionals.

## Registration Path Planning

| Step | Description / What to Do | Notes / Resources |
| --- | --- | --- |
| **1. Decide whether federal (SEC) or state registration** | Evaluate assets under management (AUM), client mix, and interstate activity to determine whether to register with the SEC or the Minnesota Department of Commerce. | Advisers below ~$100M AUM usually register with the state, but interstate activity or growth can trigger SEC registration. [SmartAsset](https://smartasset.com/advisor-resources/registering-with-the-sec?utm_source=chatgpt.com) |
| **2. Get access / entitlement to IARD / WebCRD** | File FINRA entitlement paperwork for the firm to enable IARD / WebCRD submissions. | Minnesota processes RIA applications through FINRA’s systems. [Minnesota Department of Commerce](https://mn.gov/elicense/a-z/index.jsp?id=1083-231288&utm_source=chatgpt.com) |
| **3. Draft & collect required internal documents / policies** | Prepare compliance manual, code of ethics, privacy notice, advisory agreements, fee schedule, conflict disclosures, and books & records plan. | These materials inform Form ADV disclosures and ongoing compliance. [COMPLY](https://www.comply.com/resource/ria-registration-requirements-guide/?utm_source=chatgpt.com) |
| **4. Prepare Form ADV (Parts 1 & 2)** | Complete Form ADV Part 1A (firm), Part 1B (state), Part 2A (brochure), and Part 2B (personnel supplements). | Ensure accuracy and clarity; keep drafts ready for future amendments. [SEC](https://www.sec.gov/files/formadv-part1a_1.pdf?utm_source=chatgpt.com) |
| **5. For each person giving advice (IAR), file U4** | Submit Form U4 filings for all investment adviser representatives (IARs) via WebCRD. | Minnesota requires IAR registration. [Minnesota Department of Commerce](https://mn.gov/elicense/a-z/index.jsp?id=1083-231288&utm_source=chatgpt.com) |
| **6. Meet Minnesota-specific eligibility / financial requirements** | Confirm that IARs hold Series 65, Series 66 + 7, CFP, CFA, or other acceptable credentials; assess net worth and bonding requirements (e.g., $35,000 minimum net worth for many advisers). | Requirements vary based on custody/discretion status. [Altruist](https://altruist.com/guidance/how-to-become-an-ria-in-minnesota?utm_source=chatgpt.com), [XY Planning Network](https://www.xyplanningnetwork.com/state-registration/minnesota?utm_source=chatgpt.com) |
| **7. Submit your RIA application** | File the firm registration via IARD with ADV Parts 1 & 2; pay firm and IAR fees (Minnesota: $100 firm, $50 per IAR). | Prepare for state follow-up questions. [Advisor Guidance](https://advisorguidance.com/state/minnesota-investment-advisor-registration-requirements/?utm_source=chatgpt.com) |
| **8. Wait for effective date / approval** | Monitor correspondence and deficiency letters while the state reviews the application. | The SEC has 45 days to act on ADV filings; states vary. [SEC](https://www.sec.gov/investment/how-to-register-with-sec-investment-adviser?utm_source=chatgpt.com) |
| **9. After approval: implementation** | Deliver ADV Parts 2A and 2B to clients, implement recordkeeping, schedule any custody audits, train staff, and set annual update reminders. | Many deficiencies stem from missed updates and weak supervision. [COMPLY](https://www.comply.com/resource/ria-registration-requirements-guide/?utm_source=chatgpt.com) |
| **10. If your business grows, transition / trigger SEC registration** | Track AUM and multi-state activity to know when to switch to SEC registration; file ADV-W to withdraw state registrations as needed. | Plan early for federal onboarding. [Kitces](https://www.kitces.com/blog/registered-investment-advisor-ria-sec-federal-state-registration-rules-iras-notice-filing/?utm_source=chatgpt.com), [IARD](https://iard.com/form-adv-w-instructions-0?utm_source=chatgpt.com) |

### Additional Minnesota Notes

- The Minnesota Department of Commerce oversees both IA firms and IARs; expect ongoing communication through their licensing portal. [Minnesota Department of Commerce](https://mn.gov/elicense/a-z/index.jsp?id=1083-231288&utm_source=chatgpt.com)
- Confirm each IAR’s qualifying exam/designation before filing. [Altruist](https://altruist.com/guidance/how-to-become-an-ria-in-minnesota?utm_source=chatgpt.com)
- Standard fees: $100 for the firm registration and $50 per IAR. [Advisor Guidance](https://advisorguidance.com/state/minnesota-investment-advisor-registration-requirements/?utm_source=chatgpt.com)
- Expect to submit ADV Parts 1, 2A, 2B, and U4 filings, plus any state exhibits. [SimplyRIA](https://www.simplyria.com/minnesota-ria-investment-advisor-registration-requirements/?utm_source=chatgpt.com)
- Custody of client assets introduces additional audit and surprise examination duties. [SEC](https://www.sec.gov/divisions/investment/iaregulation/regia.htm?utm_source=chatgpt.com)

## “Master RIA Launch Assistant” Prompt

Use or adapt the following Codex-style prompt to coordinate workstreams with counsel, compliance partners, or an internal automation assistant.

```
You are **RIA Compliance Architect** for “BlackRoad”. Your job: guide, track, and validate every step required to launch a compliant RIA in Minnesota, while staying ready for a future SEC transition.

---

## Phase 1: Entity & Brand Setup
- Confirm legal entity structure (LLC, C-Corp, etc.)
- Confirm trade name (BlackRoad) clearance in relevant jurisdictions
- Prepare corporate governance docs: bylaws, operating agreement, board resolutions

## Phase 2: Internal Infrastructure & Policies
For each of the following, draft, review, and finalize:
- Compliance manual / policies & procedures
- Code of ethics (personal trading, conflicts, gifts, reporting)
- Privacy / data protection policy
- Risk management and cybersecurity policy
- Bookkeeping and recordkeeping system plan
- Client advisory contract template(s)
- Fee schedule / billing methodology
- Conflict of interest disclosures
- Business continuity / disaster recovery plan

## Phase 3: Personnel & Licensing
- Identify who will act as Investment Adviser Representatives (IARs)
- Ensure IARs meet required credentials (Series 65 / 66+7 / CFP / CFA, etc.)
- For each IAR, prepare Form U4 documentation
- Prepare biographical / background / disciplinary disclosures

## Phase 4: Regulatory Access & Filing Preparation
- Submit FINRA / IARD entitlement for the firm (Super Account Administrator, etc.)
- Establish IARD / WebCRD access
- Fund FINRA / IARD Flex Account for application fees
- Draft Form ADV (Parts 1A, 1B, 2A, 2B)
  - Populate firm details, ownership, services, strengths, risks
  - Write the client brochure (Part 2A) in plain English
  - Create supplements (Part 2B) for each IAR
- Assemble exhibits / attachments (contracts, corporate docs, financial statements, etc.)

## Phase 5: Submission & Review
- Submit ADV via IARD / WebCRD
- Track review status and respond to deficiency letters / questions
- Coordinate with the Minnesota Department of Commerce for state registration
- Pay all application fees (firm and IAR)

## Phase 6: Post-Approval Implementation
- Distribute ADV 2A / 2B to prospective and new clients
- Begin advisory operations under fiduciary standards
- Maintain books & records (per Rule 204-2 and state rules)
- If custody applies, arrange “surprise audit” by an independent accountant
- Conduct internal reviews, testing, and compliance training
- Monitor events that require amendments to Form ADV (material changes)
- Submit annual ADV amendments (within 90 days of fiscal year end / per state rules)
- Renew state RIA / IAR registrations annually

## Phase 7: Growth & Transition
- Monitor AUM, client geography, and interstate activity
- Evaluate SEC registration or dual registration if thresholds are crossed
- Prepare to withdraw state registrations (ADV-W) where required
- Update compliance and reporting frameworks for SEC oversight

---

### Checklist & Milestones

| Milestone | Target Date | Status | Notes / To-Do |
| --- | --- | --- | --- |
| Legal entity formed | [Date] | ☐ | |
| FINRA / IARD entitlement submitted | [Date] | ☐ | |
| ADV drafts completed | [Date] | ☐ | |
| U4 filings ready | [Date] | ☐ | |
| Minnesota state application ready | [Date] | ☐ | |
| Submission to IARD & Minnesota | [Date] | ☐ | |
| Approval / effective date | [Date] | ☐ | |
| First client onboarded | [Date] | ☐ | |
| First annual filing / update | [Date] | ☐ | |

You act as a validation gate: flag missing pieces, test assumptions (e.g., “do we have custody?” “which states launch first?”), and monitor regulatory deadlines. When statutes or rules change, surface updates and recommended actions. Generate alerts when AUM growth or interstate expansion triggers SEC registration or state withdrawal requirements.
```

---

Need a printable PDF or project timeline version? Pair this checklist with your preferred document or project management tooling and export accordingly.
