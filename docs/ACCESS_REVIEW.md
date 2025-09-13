# Access Reviews
- Start a review: `POST /api/admin/access-review/start { quarter }`
- Attest decisions: `POST /api/admin/access-review/:id/attest`
- Evidence is written to `data/admin/access_reviews/<id>.jsonl`.
