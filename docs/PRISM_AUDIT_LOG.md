# PRISM Audit Log Events

Table schema: `audit_log(id, user_id, action, metadata, created_at)`.

## Required Events
- `auth.magic_link_sent` — metadata: `{ "email": string }`
- `auth.magic_link_used` — metadata: `{ "user_id": string }`
- `auth.slack_sso_success` — metadata: `{ "user_id": string }`
- `source.connected` — metadata: `{ "source_id": string, "type": string }`
- `dashboard.viewed` — metadata: `{ "user_id": string }`

Each entry should be inserted synchronously with the action so operators can trust the log immediately.
