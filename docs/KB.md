# Knowledge Base
- Upsert markdown articles with public/internal visibility and tags; searchable.
- Publish article: `POST /api/support/kb/publish { slug, title, md }`.
- Search: `GET /api/support/kb/search?q=...`.
- Build static HTML with `support-kb-publish` workflow (to `public/help/`).
