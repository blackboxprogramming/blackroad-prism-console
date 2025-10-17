# SLAs
- Define policies per priority; evaluate for first response & resolution targets.
# SLA Policies
- Configure in `support/sla_policies.yaml`.
- Apply SLA to a ticket: `POST /api/support/sla/apply { id }`.
- Status: `GET /api/support/sla/status/:id`.
