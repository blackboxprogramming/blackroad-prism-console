# Blameless Postmortem Template

The goal of this template is to document what happened without blame, surface system patterns quickly, and ensure the follow-up work prevents repeat incidents.

## 1. Incident Summary
- **Incident ID / Title**:
- **Date & Timeframe**:
- **Detection Method**:
- **Initial Reporter**:
- **Severity / Priority**:
- **Status**: _Resolved | Monitoring | Follow-up_.
- **Executive Summary**: 2–3 sentences covering the what/when.

## 2. Impact
- **Impacted Customers / Teams**:
- **Impacted Systems / Services**:
- **Customer Experience**: (e.g., degraded latency, failed payments).
- **Duration of Impact**:
- **Business / Compliance Effect**:

## 3. Timeline
Document key events minute-by-minute (UTC preferred). Include manual actions and automation.

| Time (UTC) | Event | Actor | Notes |
| --- | --- | --- | --- |
| 00:00 | Detection event logged | | |
| 00:05 | On-call acknowledged | | |
| 00:12 | Mitigation step executed | | |

## 4. Root Cause Analysis
Apply systems thinking to explain how the incident unfolded. Avoid blame; focus on contributing factors.

- **Triggering Event**:
- **Contributing Factors** (technical, process, organizational):
- **Safeguards That Worked**:
- **Safeguards That Failed or Were Missing**:
- **5-Whys / Causal Chain Summary**:

## 5. Resolution & Recovery
- **Mitigation Actions Taken**:
- **Verification Steps** (logs, monitors, QA):
- **Residual Risk / Outstanding Issues**:
- **Communication Summary** (status page, stakeholders):

## 6. Lessons Learned
Capture improvements to upstream systems, runbooks, or processes.

- **Early Signals We Missed**:
- **What Went Well**:
- **What We Should Change**:
- **Monitoring / Alerting Gaps**:

## 7. Action Items
Track remediation with clear ownership, deadlines, and validation. Link to tickets when possible.

| Action Item | Owner | Due Date | Status | Verification |
| --- | --- | --- | --- | --- |
| | | | Not Started | |
| | | | In Progress | |
| | | | Complete | |

---
*Prepared by:* 
*Date Prepared:* 
*Reviewers:* 
