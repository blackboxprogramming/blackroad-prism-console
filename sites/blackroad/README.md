# BlackRoad.io — Ops

**Deploy commands (ChatOps):**
- `/deploy blackroad pages` — GitHub Pages
- `/deploy blackroad vercel` — Vercel (needs `VERCEL_*` secrets)
- `/deploy blackroad cloudflare` — Cloudflare Pages (needs `CF_*` + `CF_PAGES_PROJECT`)

**Useful:**
- `/site status` — quick HTTP code check
- `/site url` — prints configured URL
- `/urls` — lists primary, GH Pages, and status.json URLs

**Status page:** available at `/status` (reads `sites/blackroad/public/status.json`, updated every 30 minutes by workflow).

**Lucidia video generation:** site now exposes a `video` worker at
`sites/blackroad/api/video.ts` that forwards requests for basic animated
GIF creation powered by Lucidia's new `/video` API.
