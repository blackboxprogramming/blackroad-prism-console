# DSAR
- Create: `POST /api/privacy/dsar/create { type, subjectId, email }`
- Check: `GET /api/privacy/dsar/:id`
- Complete: `POST /api/privacy/dsar/:id/complete`
- Fulfill: `node scripts/privacy/export_subject.ts <subjectId>`
- Erase: `node scripts/privacy/erase_subject.ts <subjectId>`
