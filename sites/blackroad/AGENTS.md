# BlackRoad.io — Ops & Content

### Blog content
- Add Markdown under `sites/blackroad/content/blog/*.md` with frontmatter:
```yaml
---
title: "My Post"
date: "2025-08-16"
tags: [tag1, tag2]
description: "Short summary for listings."
---
```

- Build step converts to:
  - `public/blog/<slug>.json` (SPA route /blog/:slug)
  - `public/blog/<slug>.html` (static HTML for crawlers)
  - `public/blog/index.json` (listing)

PR Screenshot Diff
- Workflow: PR Screenshot Diff (Pages build)
- Produces artifacts: base.png, pr.png, diff.png with mismatch %
- Auto-comments on the PR.

Cache ChatOps
- `/cache purge` → Purge Cloudflare cache (needs CF_API_TOKEN, CF_ZONE_ID)
- `/cache warm` → Dispatches daily warm + screenshot job

---

### Use it now

- Ship site + blog:

`/deploy blackroad pages`

- Add a blog post: commit a new `.md` file to `sites/blackroad/content/blog/` and push. Build will regenerate index and pages.

- Get per-PR visual diffs: open a PR that changes `sites/blackroad/**`.

- Cache ops:

`/cache purge`
`/cache warm`

If anything fails, order the bots to **fix it and create missing files**:

`/codex apply .github/prompts/codex-fix-anything.md`
