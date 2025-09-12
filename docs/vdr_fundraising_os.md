# VDR & Fundraising Readiness OS

## 1. Executive Overview
- **Scope:** Build an investor-grade virtual data room and repeatable diligence workflow for seed to Series B rounds.
- **Investor Audiences:** Lead and follow-on VC funds, strategic investors, select advisors under NDA.
- **Top Risks:** Security of confidential data, incomplete compliance filings, inconsistent financial metrics, and uncontrolled investor communications.

## 2. VDR Information Architecture
```json
{
  "vdr_version": "v1.0",
  "company": "<COMPANY_NAME>",
  "round": "Seed|A|B|Growth",
  "sor": "SharePoint|Google Drive|Box|Other",
  "folders": [
    {"path": "/00_README", "owner": "GC", "retention": "PERMANENT"},
    {"path": "/01_Corporate", "owner": "GC", "retention": "PERMANENT"},
    {"path": "/02_Finance_Tax", "owner": "CFO", "retention": "7Y"},
    {"path": "/03_Cap_Table_Equity", "owner": "GC", "retention": "PERMANENT"},
    {"path": "/04_IP", "owner": "GC", "retention": "PERMANENT"},
    {"path": "/05_Product_Security", "owner": "CISO", "retention": "PERMANENT"},
    {"path": "/06_HR_People", "owner": "HR", "retention": "7Y"},
    {"path": "/07_Commercial_GTM", "owner": "CRO", "retention": "7Y"},
    {"path": "/08_Litigation_Compliance", "owner": "GC", "retention": "PERMANENT"},
    {"path": "/09_Board_Minutes_Consents", "owner": "GC", "retention": "PERMANENT"},
    {"path": "/10_Executed_Agreements", "owner": "GC", "retention": "PERMANENT"},
    {"path": "/Z_Appendix_Policies_Controls", "owner": "CISO", "retention": "PERMANENT"}
  ],
  "naming": "<YYYY-MM-DD>__<DocType>__<ShortDesc>__v<M.m>.pdf"
}
```

## 3. Diligence Request Matrix
- **Finance/Tax:** Historical financials, monthly KPIs, tax returns, debt agreements.
- **Legal/Corporate:** Charter, bylaws, state registrations, material contracts, litigation.
- **Equity/Cap Table:** Fully diluted cap table, option grants, 409A reports, Rule 701 tracking.
- **IP:** Patent/trademark list, assignments, open-source compliance SBOM.
- **Product/Security:** Architecture diagrams, subprocessor list, SOC 2/ISO posture, pentest letter.
- **HR/People:** Org chart, key resumes, compensation policy, employment agreements.
- **GTM/Commercial:** Top customers, churn analysis, pricing, pipeline.

## 4. Document Kits
### Finance
- **How-to:** Collect last 3 years P&L/BS/CF, reconcile to bank statements.
- **Template:** `<YYYY-MM-DD>__FIN__P&L__v1.0.xlsx`
- **Compliance Anchors:** GAAP revenue recognition.
- **Implementation Notes:** CFO owns; view-only for investors; watermark enabled.
- **QA Checklist:** Totals tie to trial balance; formulas locked.

### Legal/Corporate
- **How-to:** Compile charter, bylaws, amendments, board and stockholder consents.
- **Template:** Board consent template: “This is general information, not legal advice; consult qualified counsel.”
- **Compliance Anchors:** Delaware §141(f) action by written consent [NEEDS VERIFICATION].
- **Implementation Notes:** GC reviews; PDFs with bookmarks; watermark.
- **QA Checklist:** Ensure all amendments included; signatures present.

### Equity/Cap Table
- **How-to:** Export cap table CSV, obtain latest 409A report, update option ledger.
- **Template:** Option grant agreement with disclaimer: “This is general information, not legal advice; consult qualified counsel.”
- **Compliance Anchors:** SEC Rule 701; IRS 409A ATG.
- **Implementation Notes:** GC controls; spreadsheets locked; watermark.
- **QA Checklist:** Totals reconcile to charter; 409A valuation date within 12 months.

### IP
- **How-to:** List patents/trademarks, collect assignments, verify PIIA coverage.
- **Template:** PIIA agreement disclaimer: “This is general information, not legal advice; consult qualified counsel.”
- **Compliance Anchors:** Assignment recording rules [NEEDS VERIFICATION].
- **Implementation Notes:** GC stores executed PDFs; watermark; no download.
- **QA Checklist:** All contributors have assignments; docket numbers verified.

### Product/Security
- **How-to:** Generate data flow diagrams, list subprocessors, attach latest SOC 2/ISO letters.
- **Template:** Pentest attestation request.
- **Compliance Anchors:** AICPA SOC 2 TSC; ISO/IEC 27001.
- **Implementation Notes:** CISO owns; access limited to security reviewers; watermark.
- **QA Checklist:** Subprocessors match production; pentest <12 months old.

### HR/People
- **How-to:** Prepare org chart, collect key employee agreements, summary comp table.
- **Template:** Offer letter with PIIA clause (include disclaimer).
- **Compliance Anchors:** Rule 701 disclosure thresholds.
- **Implementation Notes:** HR controls; redact PII; watermark.
- **QA Checklist:** Verify all employees have executed agreements; salary bands documented.

### GTM/Commercial
- **How-to:** Summarize top 20 MSAs, compile churn metrics, attach standard order form.
- **Template:** Customer reference sheet.
- **Compliance Anchors:** None.
- **Implementation Notes:** CRO reviews; watermark.
- **QA Checklist:** ARR figures match finance; references approved.

## 5. Fundraising Compliance Box
- **Reg D 506(c):** General solicitation permitted only with accredited investor verification [oai_citation:0‡SEC].
- **Reg D 506(b):** No general solicitation; up to 35 sophisticated non-accredited investors with enhanced disclosures [oai_citation:1‡SEC].
- **Form D:** File within 15 days of first sale; no fee [oai_citation:2‡SEC].
- **Rule 701:** Equity comp exemption with disclosure obligations at thresholds [oai_citation:3‡SEC].
- **409A:** Fair market value for options; refresh valuation every 12 months or upon material event [oai_citation:4‡IRS].
- **Blue Sky:** Coordinate state filings as required [NEEDS VERIFICATION].

## 6. Access Control & Security
```json
{
  "roles": [
    {"role":"VDR-Admin","permissions":["owner"],"members":["GC","CFO"]},
    {"role":"VDR-Internal-Core","permissions":["view","comment"],"members":["CEO","CISO","COO"]},
    {"role":"Investor-Lead","permissions":["view","comment"],"members":[]},
    {"role":"Investor-Guest","permissions":["view"],"members":[]},
    {"role":"Advisor-Counsel","permissions":["view","comment"],"members":[]}
  ],
  "rules": {
    "download": false,
    "print": false,
    "link_ttl_days": 7,
    "watermark_overlay": "<email> · Confidential · <timestamp>",
    "two_person_approval_for_export": true,
    "audit_log_retention": "PERMANENT"
  }
}

- Enforce SSO and MFA; watermark all documents; maintain audit logs.
- For broker-dealers, ensure SEC 17a-4 compliant storage (WORM or audit-trail alternative) [oai_citation:8‡SEC].

## 7. Investor Q&A Workflow
1. Intake via secure form or email to GC/CFO.
2. Triage and assign owners.
3. Draft response, attach supporting docs.
4. GC/CISO approve before release.
5. Log thread with SLA and archive.

```json
{
  "qid":"Q-2025-001",
  "investor":"<FUND_NAME>",
  "topic":"Security",
  "question":"Describe data retention policies",
  "answer":"...",
  "attachments":["/05_Product_Security/pentest_letter.pdf"],
  "status":"ANSWERED",
  "sla_due":"2025-05-01",
  "approvals":["CISO","GC"]
}
```

## 8. Metrics Pack
- **ARR & MRR** bridges and cohort tables.
- **GRR/NRR** calculations with cohorts.
- **CAC, LTV, Payback** by segment.
- Document data provenance and calculation formulas.

## 9. Risk Register
| ID | Risk | Mitigation | Owner |
|----|------|------------|-------|
| R1 | Data leak from VDR | View-only, watermark, audit logs | CISO |
| R2 | Missed Form D deadline | Calendar reminders, counsel review | GC |
| R3 | Outdated 409A valuation | Schedule refresh each 12 months | CFO |
| R4 | Uncontrolled Q&A responses | Centralized review workflow | GC |
| R5 | Incomplete IP assignments | Docket review and follow-up | GC |
| R6 | KPIs inconsistent | Single source of truth in finance | CFO |
| R7 | Unauthorized access | SSO/MFA, role reviews | CISO |
| R8 | Blue Sky filings missed | Engage local counsel | GC |
| R9 | Vendor security gaps | Subprocessor due diligence | CISO |
| R10| Loss of executed docs | Immutable backup storage | GC |

## 10. Definition of Done
- All folders populated with approved documents per checklist.
- Access policy enforced; audit logs enabled.
- Form D filed; 409A current; Rule 701 tracked.
- Investor Q&A workflow operational with SLA tracking.
- Post-close: lock VDR, archive executed docs to immutable storage, retain logs permanently.
