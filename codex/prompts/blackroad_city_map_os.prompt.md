CODEx PROMPT — BlackRoad "City Map" OS & Portals

0) North Star

You are building BlackRoad, a two‑portal AI‑native platform presented as a City Map OS:
•Front stage: BlackRoad.io — creative suite (search, social, video, coding, tutoring).
•Back stage: BlackRoadInc.us — infra/finance (RoadChain, RoadCoin, investor/admin).
•Symbolic layer: Lucidia (trinary/Ψ recursion), Codex Infinity (tabbed OS), Roadie (tutor).
•Home = City Map: a clickable, animated map where every feature is a district/building.

Adopt the stacks and delivery order implied by the attached briefs. Honor brand style (dark, neon gradient, rounded glass cards) and the acceptance checks below.

⸻

1) Deliverables (MVP scope)
1.City Map Home (BlackRoad.io)
•A responsive map UI (desktop/mobile) that renders districts & buildings:
•Downtown (core infra): RoadChain Tower, RoadCoin Mint, BlackRoad.io HQ, Genesis Road Studio.
•Learning District: Roadie Schoolhouse, Lucidia Lab, Athena Hall, RoadBook Library, RoadView Cinema.
•Community District: Car Pool Hub, Rest Stop Café, Signal Tower, Stop Light Plaza, Roundabout.
•Industrial Zone: Pit Stop Garage, Cruise Control Depot, Detour Alley, Overpass Bridge.
•Hover tooltips (name, 1‑line pitch, status chip).
•Click → route to each portal surface (or placeholder if not built).
•Seasonal skinning (flags for “spooky”, “winter”, “festival”).
2.All AI Portal dashboard (post‑login)
•Service cards for Roadie, Lucidia, Athena, RoadBook, RoadView, RoadChain with live health chips reading /api/health.
3.Authentication/SSO (MVP)
•Email+password; session → JWT access (short) + refresh (long), zero‑trust checks at API.
4.Search landing (stub) that calls the IO API and shows json results.
5.Portal stubs with routes & shells:
•RoadBook feed list, RoadView player page, Roadie chat shell, Lucidia editor shell, RoadChain explorer list.
6.Ops & health: NGINX reverse proxy; /api/health, /api/services, logs & basic metrics.

⸻

2) UX & Visual Spec
•Theme: black canvas + neon gradient accents (sunset→magenta→violet→cyan), soft glassmorphism, accessible contrast.
•City Map:
•Vector/SVG grid with layered parallax; buildings are components (React) with status light.
•Roadie mascot can “drive” to a clicked building (simple tween).
•Keyboard nav: Tab cycles buildings; Enter opens.
•Reduce Motion: honor prefers‑reduced‑motion; switch off parallax/tweens.
•A11y: WCAG AA color contrast; focus rings; aria‑labels per building.
•Gamification hooks: buildings animate on achievements (e.g., first post lights RoadBook Library).

⸻

3) Architecture & Routing
•Frontend: Next.js 13+ (App Router) + Tailwind.
•/(public)/home → City Map; /(authed)/portal/* → dashboards.
•Shared layout: header (logo, status dot, profile), footer (Health • Services • Docs).
•Backend (IO‑API & INC‑API): Python Flask; Socket.IO for real‑time features.
•Workers: Celery 5 + Redis.
•Data: Postgres 15; Redis cache; MinIO for media.
•Blockchain: RoadChain (PoA) node JSON‑RPC at 8545; wallet facade in IO.
•Edge: NGINX 80/443 reverse proxy; JWT protected routes to APIs.
•Auth: Lucidia SSO (Flask + PyJWT + Redis), access+refresh cookie model.
•Ports (reference): 9000 io app/api, 8000 inc app/api, 7000 SSO, 5555 Celery, 5432 PG, 6379 Redis, 9001 MinIO, 8545 RoadChain.

⸻

4) City Map → Routes (click‑through)

BuildingRouteMVP View
BlackRoad.io HQ/dashboardAll‑AI dashboard cards + health
RoadChain Tower/portal/roadchainHeight, TPS, latest blocks/tx (stubbed)
RoadCoin Mint/portal/walletBalance, send/receive modal (stub)
Genesis Road Studio/portal/genesisComing soon panel; small WebGL canvas
Roadie Schoolhouse/portal/roadieChat shell (composer, message list, persona switcher)
Lucidia Lab/portal/lucidiaMonaco editor + right‑pane assistant (no exec)
Athena Hall/portal/athenaCode viewer + pair‑programming presence stub
RoadBook Library/portal/roadbookFeed list; post card stub; like/comment buttons
RoadView Cinema/portal/roadviewVideo player stub + transcript placeholder
Car Pool Hub/portal/carpoolRooms list; “create room” stub
Rest Stop Café/portal/reststopTimer + wellness tips
Signal Tower/portal/notificationsList of system events
Stop Light Plaza/portal/approvalsApprovals list (green/yellow/red)
Roundabout/portal/ideasIdea generator textarea; tag chips
Pit Stop Garage/portal/maintenanceHealth, logs links
Cruise Control Depot/portal/automationJob toggles & cron presets
Detour Alley/portal/experimentalFeature flag flips
Overpass Bridge/portal/integrationsOAuth cards (placeholders)

⸻

5) APIs (MVP contracts)
•GET /api/health → { status:'ok', uptime, version }
•GET /api/services → [ {name, status, url, latencyMs}, ... ]
•POST /api/login { email, password } → { accessToken, refreshToken, user }
•POST /api/refresh { refreshToken } → { accessToken }
•GET /api/search?q=... → { results:[{title, url, snippet}], count } (stub)
•GET /api/chain/summary → { height, tps, peers } (stub)
•GET /api/wallet (authed) → { address, balance } (stub)

Auth policy: access token in Authorization Bearer; refresh via HttpOnly cookie.

⸻

6) Data Models (initial)

type ServiceHealth = { name:string; status:'up'|'down'|'degraded'; url:string; latencyMs:number }
type User = { id:string; email:string; handle:string; avatarUrl?:string; roles:string[] }
type Post = { id:string; authorId:string; body:string; mediaUrl?:string; tags:string[]; createdAt:string }
type Video = { id:string; title:string; src:string; captionsUrl?:string; createdAt:string }
type BlockSummary = { height:number; hash:string; txCount:number; time:string }


⸻

7) Interactions & State
•City Map store: { buildings:[{id, name, route, status, unlocked}], theme:{season, reducedMotion} }
•Status dot: pings /api/health every 30s; up=green, warn=yellow, down=red.
•On unlocks: update unlocked and animate building glow (respect Reduce Motion).

⸻

8) Symbolic Layer Hooks (non‑blocking MVP)
•Wire Lucidia & Codex Infinity via an adapter:
•Provide POST /api/symbolic/insight { topic } → { text, code?, svg? } that currently returns staged copy; later route to Lucidia.
•Breath/Ψ are non‑blocking placeholders in MVP; expose feature flag symbolicMode=true to enable UI badges on Lucidia/Roadie.

⸻

9) Accessibility, Perf, Security
•A11y: semantic HTML, aria labels on buildings; focus traps in modals; skip‑to‑content.
•Perf: prefetch narrow building components on hover; lazy‑load non‑critical panels.
•Security: CSRF for login; JWT verify on each API call; rate‑limit /api/login & /api/search.

⸻

10) Brand Guardrails
•Palette: black base + neon gradient accents; soft shadows; 2xl rounded corners.
•Typography: bold display for titles, comfortable line height.
•Motion: subtle drift/parallax; drop to 0 on prefers-reduced-motion.
•Cards: glass blur at 8–12px; border 1px white/10.

⸻

11) Acceptance Checklist (must pass)
•City Map renders on desktop & mobile; keyboard navigation works.
•Live status dot mirrors /api/health.
•Clicking each building navigates to a real route (even if a stub).
•Login works; dashboard shows service cards with live health chips.
•Search returns a list (stub is fine); errors show friendly toasts.
•Accessibility audit passes (labels, focus, contrast).
•NGINX reverse proxy handles /api/* to backend, / to SPA; HTTPS OK.
•CI runs lint + typecheck + minimal API tests; logs collected.

⸻

12) Tech Tasks (shortlist)
1.City Map Canvas: SVG or React‑Three fiber (choose SVG first for A11y), componentize buildings, add status chip.
2.Routes & Layouts: Implement /portal/* shells; shared Header + profile menu.
3.Auth: Email/password + refresh; protect /(authed) routes.
4.Health/Services: Flask endpoints; wire status chip & dashboard.
5.Search Stub: IO API echo; landing renders cards; spinner & empty state.
6.Ops: NGINX config with /api proxy, HTTPS, gzip; PM2 or systemd unit.
7.Testing: basic e2e for nav & login; API smoke tests.
8.Flags: seasonTheme, symbolicMode, reducedMotion.

⸻

13) Nice‑to‑Have (v1+)
•RoadBook CRUD (create post; comment).
•RoadView upload + transcode worker (Celery+ffmpeg).
•Wallet panel reading RoadChain RPC.
•Persona switcher in Roadie (Roadie/Lucidia/Athena/Radius).
•City unlock animations for simple achievements.

⸻

14) Output Requirements (what the agent/tool must emit)
•Next.js project with City Map page and routes above.
•Flask IO‑API with /api/health, /api/services, /api/search, auth routes.
•NGINX config that proxies /api to IO‑API service and serves SPA.
•Docs: README.md (run/dev), README-OPS.md (nginx, env vars), OpenAPI snippet for the IO‑API.
•Tests: minimal Jest/Playwright for nav & login; pytest for /api/health.
•Brand constants: tailwind config (colors, radii), motion flags.

⸻

15) Constraints & Style Rules
•Don’t ship hardcoded secrets.
•Keep TS strict mode and ESLint on.
•Minimize dependencies; stick to stack above.
•Prefer composition over monolith components.
•Always check prefers-reduced-motion.
•Keep “city” nouns consistent; no random portal naming.

⸻

16) Example Building Object (frontend)

type Building = {
  id: 'roadchain-tower'|'roadcoin-mint'|'lucidia-lab'|string
  name: string
  route: string
  district: 'downtown'|'learning'|'community'|'industrial'
  status: 'up'|'down'|'locked'
  icon: ReactNode
  ariaLabel: string
}


⸻

17) Success Condition (definition of done)

A user lands on BlackRoad.io → sees the City Map → can keyboard/hover/click to any building → logs in → lands on a working dashboard with live health chips → can open each portal route without 404s → NGINX proxies API; SSL is good; CI passes; a11y checks are green.

⸻

Execute.
