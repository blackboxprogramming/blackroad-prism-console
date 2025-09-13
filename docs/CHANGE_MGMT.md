# Change Management
- Policies in `agents/change_policies.yaml`.
- Approval via `change-approve.yml` (protected `production` environment).
- Worker verifies `CHANGE_APPROVAL_SECRET` before executing sensitive intents.
