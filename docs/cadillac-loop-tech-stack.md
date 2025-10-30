# Cadillac Loop Prototype Tech Stack

## Guiding Principles
- **Single codebase** so the team can ship UI, API, and storage glue quickly without managing multiple deploy targets.
- **Managed services first** to avoid spending the first month on infra; use free tiers wherever possible.
- **Test-mode friendly payments** so the payout loop is provable in day-one demos and trivial to reconcile later.

## Core Components

| Capability | Recommendation | Rationale |
| --- | --- | --- |
| Web app (upload + gallery + dashboard) | **Next.js 14 (App Router) on Vercel** | One repo handles SSR UI + API routes. Vercel free tier is enough for the first month and ships previews for daily story posts. |
| Authentication | **Supabase Auth (Email magic link or OAuth)** | Drop-in auth that plays well with Next.js and gives an instant users table for creator accounts. |
| File storage | **Supabase Storage buckets** | Handles images/video/text uploads with signed URLs; pairs with Supabase Postgres for metadata without configuring AWS manually. |
| Database | **Supabase Postgres** | Store creator profiles, uploads, and RoadCoin balances in the same managed service. |
| Reward calculation | **Next.js API Route / Server Action** | A simple TypeScript function that increments `roadcoin_balance` based on view counts. Keeps logic close to the UI and debuggable. |
| View tracking | **Supabase Edge Function or Realtime channel** | Lightweight counter that fires when a gallery item loads; writes back to Postgres. |
| Payments | **Stripe Connect (Standard accounts, Test mode)** | Allows fake payouts in test mode and real ones later; $5 manual release via Stripe Dashboard proves the loop. |
| Background jobs | **Vercel Cron or Supabase Scheduled Function** | Reconcile balances and trigger payout checks daily without owning servers. |
| Analytics / logging | **Vercel Analytics + Supabase logs** | Enough to confirm “view happened → balance changed” while staying in free tiers. |

## Local Development
- **Tooling**: PNPM, TypeScript, ESLint, Prettier (Vercel + Next defaults).
- **Testing**: Vitest or Jest for API utilities; Playwright for the upload → gallery happy path.
- **Env management**: `.env.local` with Supabase keys and Stripe test keys. Use Supabase CLI for local Postgres if offline work is needed.

## Hosting & Deployment
- Push to GitHub → Vercel deploys automatically.
- Supabase project lives in free tier; configure Row Level Security for uploads table early.
- Stripe webhook (test mode) handled via Next.js Route Handler using the Vercel Edge runtime.

## 30-Day Implementation Milestones

| Week | Focus | Deliverables |
| --- | --- | --- |
| 1 | **Skeleton loop** | Upload form writing to Supabase, gallery listing, RoadCoin balance column seeded with a fixed reward per view. |
| 2 | **View tracking & rewards** | Realtime view counter hooked to the gallery; API route updates balance based on views. Creator dashboard shows history. |
| 3 | **Stripe payout** | Stripe Connect onboarding, test payouts of $5, webhook updates `payouts` table. Screenshot + story post. |
| 4 | **Polish & storytelling** | Daily build-in-public updates, add basic moderation toggles, prep metrics dashboard (creators count, total RoadCoin, payouts). |

## Cost Snapshot (Month One)
- Vercel: Free (assuming <100 GB bandwidth, <1M serverless invocations).
- Supabase: Free tier covers 500 MB database + 1 GB storage; upgrade if video uploads exceed limit.
- Stripe: No platform fees in test mode; plan for standard 2.9% + 30¢ once live.

## Why It Works
- Minimizes infra setup so the team ships the proof-of-life loop fast.
- Uses boring, well-supported integrations (Stripe, Supabase) that scale past the prototype.
- Keeps every artifact (app, data, payouts) in auditable systems, making the story content credible when shared publicly.
