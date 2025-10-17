# Contract Lifecycle Management
- Draft → Review/Approvals → Approved → Signed → Active/Expired
- Approvals routed per type; e-sign webhook updates state to "Signed".
- Renewals: weekly reminders (90/60/30 days); obligations tracked separately.
# CLM

Contract lifecycle management endpoints live under `/api/clm`.
Modules cover templates, clauses, requests, contracts, e-sign, approvals, obligations, renewals and repository search.
