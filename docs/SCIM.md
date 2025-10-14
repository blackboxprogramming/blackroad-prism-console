# SCIM Provisioning (Stub)
- Ingest SCIM payloads for users/groups and record to audit log.
# SCIM 2.0
- Users: `GET/POST /scim/v2/Users`, `GET/DELETE /scim/v2/Users/:id`.
- Groups: `GET /scim/v2/Groups`.
- Protect with `Authorization: Bearer ${SCIM_BEARER_TOKEN}`.
