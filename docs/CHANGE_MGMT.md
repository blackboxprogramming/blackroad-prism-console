# Change Management
- Create/approve CRQs; manage states and change calendars (freeze/maintenance windows).
- Policies in `agents/change_policies.yaml`.
- Approval via `change-approve.yml` (protected `production` environment).
- Worker verifies `CHANGE_APPROVAL_SECRET` before executing sensitive intents.
