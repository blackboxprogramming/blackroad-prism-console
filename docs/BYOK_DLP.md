# BYOK / DLP
- Envelope encryption via `apps/api/src/lib/kms.ts` (AWS or local fallback).
- Configure `KMS_PROVIDER`, `KMS_KEY_ID`, `KMS_REGION`.
- DLP middleware redacts patterns from `DLP_REGEXES` (JSON array of regex/replacement).
