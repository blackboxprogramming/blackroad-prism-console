# Lead Scoring
- Rules in `marketing/lead_score/rules.yaml`, decay included.
- Upsert via `POST /api/mkt/score/upsert`; read score via `GET /api/mkt/score/:subjectId`.
