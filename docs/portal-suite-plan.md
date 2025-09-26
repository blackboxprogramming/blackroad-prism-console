# BlackRoad Portal Suite Implementation Plan

This plan outlines how to build a cohesive suite of portals for the BlackRoad ecosystem:

1. **Chat** – real‑time AI assisted coding & terminal interface.
2. **BackRoad Social** – social network for posts, groups and messages.
3. **RoadView** – video‑sharing platform.
4. **RoadChain** – blockchain explorer and staking dashboard.
5. **RoadCoin Wallet** – portfolio and transaction manager.

Each portal will expose a modern web front end backed by a collection of Node.js microservices.  Shared packages live in the `packages/` workspace and common infrastructure runs on Docker.

## 1. Chat

**Front end**
- React + TypeScript with Vite for fast iteration.
- Components for chat history, code editor (Monaco) and terminal output.
- Dark theme to match the design mockup.

**Back end**
- Express API providing chat threads and code execution tasks.
- WebSocket gateway for streaming assistant responses and terminal output.
- Containerised Python worker executing code in sandboxes.

**Data**
- PostgreSQL: users, sessions, messages, executions.
- Redis: ephemeral session state and rate‑limiting.

**Initial tasks**
1. Scaffold `apps/chat` with Vite + React.
2. Create `services/chat-api` exposing REST + WS endpoints.
3. Integrate with auth service from `services/auth` (TBD).

## 2. BackRoad Social

**Front end**
- Next.js app under `apps/social` with server‑side rendering for SEO.
- Components: feed, profile, groups, notifications.

**Back end**
- `services/social-api` built with NestJS for structured modules.
- REST/GraphQL for posts, comments, reactions, friends, groups.
- Background jobs (BullMQ) for notifications and feed generation.

**Data**
- PostgreSQL: users, posts, comments, reactions, friendships.
- S3 compatible storage for images and videos.

**Initial tasks**
1. Scaffold Next.js project.
2. Define database schema with Prisma migrations.
3. Implement basic CRUD for posts and profiles.

## 3. RoadView

**Front end**
- `apps/roadview` using Next.js + Tailwind.
- Video player with preview thumbnails and dark UI.

**Back end**
- `services/roadview-api` (NestJS) handling uploads, transcoding jobs, and streaming.
- Uses FFmpeg workers executed via queue.

**Data**
- PostgreSQL for metadata, S3 for raw and transcoded video.

**Initial tasks**
1. Upload API accepting video + metadata.
2. Worker that transcodes to HLS.
3. Video listing page with search and tags.

## 4. RoadChain

**Front end**
- `apps/roadchain` using React + Recharts for dashboards.
- Displays wallet balances, staking data and latest blocks.

**Back end**
- `services/roadchain-api` querying blockchain nodes and caching results.
- Scheduled indexer writes blocks and transactions to PostgreSQL.

**Data**
- PostgreSQL: chain data, validator sets.
- Redis cache for hot metrics.

**Initial tasks**
1. Implement block fetcher and persistence job.
2. API routes for balances and recent blocks.
3. Dashboard components with charts.

## 5. RoadCoin Wallet

**Front end**
- `apps/wallet` built in React Native Web so code can target mobile later.
- Views: portfolio, send/receive, transaction history.

**Back end**
- `services/wallet-api` handling account management and signing requests.
- Connects to RoadChain API for chain data.

**Data**
- PostgreSQL: accounts, transactions, staking positions.
- Hardware key or MetaMask integration for signing.

**Initial tasks**
1. Scaffold React Native Web app.
2. API endpoints for balances and transfers.
3. Integrate with RoadChain and auth services.

## Cross‑cutting Concerns

- **Authentication**: central `services/auth` providing JWTs via OAuth / email magic links.
- **Shared UI Library**: `packages/ui` with components, theme tokens, icons.
- **Telemetry**: OpenTelemetry traces & metrics shipped to Grafana.
- **CI/CD**: GitHub Actions running tests and building Docker images per service.

## Milestones

1. **MVP Chat** – interactive coding assistant and terminal (2–3 weeks).
2. **Social + Auth foundation** – basic feed and profiles with login (4–6 weeks).
3. **Video platform** – upload, transcode, playback (6–8 weeks).
4. **Blockchain explorer & wallet** – chain indexer and wallet views (6–8 weeks).
5. **Unified design system** – refine UI across portals and add integration tests.

This roadmap provides the structure to develop each portal incrementally while sharing infrastructure and design across the BlackRoad suite.

