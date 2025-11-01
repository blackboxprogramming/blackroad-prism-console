# Unity Exporter Productization Plan

## 1. Enhancements Required for Commercial Viability
- **Production-grade export pipeline**
  - Harden archive generator with checksum verification, deterministic file ordering, and resumable downloads.
  - Add Unity LTS compatibility matrix (2021 LTS, 2022 LTS, 2023 LTS) with automated regression fixtures.
  - Provide configurable render pipeline presets (Built-in, URP, HDRP) and platform toggles (PC, Quest, Vision Pro).
- **Collaboration & workflow integrations**
  - OAuth + API keys with scoped permissions for studios and bots.
  - Web dashboard for job history, asset diffs, and replays.
  - Native connectors for GitHub/GitLab repos, Slack alerts, and Linear/Jira issue backlinks.
- **Content intelligence**
  - Optional prompt-to-scene generator using existing agent framework; deliver structured JSON to exporter.
  - Scene validation: NavMesh generation hints, lightmap baking suggestions, shader compatibility warnings.
  - Asset ingestion: upload existing FBX/GLTF bundles to embed into starter scene.
- **Operational readiness**
  - Multi-tenant job queue with rate limiting and autoscaling workers.
  - Observability suite (Prometheus metrics, structured logs, trace sampling) with Grafana dashboards.
  - Enterprise controls: SSO (SAML/OIDC), audit trails, private network deployment support.
- **Documentation & support**
  - Interactive tutorials, sample projects, and API playground.
  - SLA-backed support tiers, incident response runbooks, and upgrade cadence policy.

## 2. Primary User Segments
- **Solo creators & hobbyists** – Need instant project scaffolds and lightweight customization without managing Unity templates.
- **Indie studios** – Value collaborative history, integration with source control, and affordable scaling for multiple experiments.
- **Agent-framework builders** – Want deterministic programmatic exports from language-model driven pipelines with metadata webhooks.
- **Enterprise prototypers** – Require compliance (SOC2-ready), custom render pipelines, and on-prem or VPC-hosted options to protect IP.

## 3. Pricing Models
- **API Metered**
  - Free tier: 3 exports/month, watermark splash, community support.
  - Pro tier: $49/month + $0.50/export beyond 30 jobs, includes GitHub/Slack integrations.
  - Scale tier: volume-based pricing with usage dashboards and dedicated Slack channel.
- **SaaS Seats**
  - Team plan: $25/user/month for dashboard access, shared asset library, role-based controls.
  - Studio plan: $59/user/month adds automated QA reports, custom templates, and analytics.
- **On-Prem / Private Cloud License**
  - Annual contract starting at $25k including deployment automation, priority patches, and customer success engineering.

## 4. Competitive Positioning
- **Unity templates & sample projects** – Static, manual setup. Unity Exporter offers dynamic, metadata-driven scaffolding with API hooks.
- **Playmaker / visual scripting tools** – Focus on runtime behavior prototyping; our exporter complements them by standing up fully configured projects ready for those tools.
- **Procedural-generation platforms (Inworld, Scenario, etc.)** – Generate assets but lack turnkey Unity project wiring; we deliver ingest + project packaging.
- **Internal studio pipelines** – Require maintenance and are siloed; we provide managed service with guardrails, analytics, and agent interoperability.

## 5. Delivery Roadmap
- **2-week MVP**
  - Harden exporter CLI, add checksum & manifest signing.
  - Basic user accounts with API key issuance.
  - Hosted dashboard MVP listing exports and download links.
  - Instrument exporter with metrics + structured logs.
- **1-month v1 Launch**
  - Unity LTS compatibility matrix & automated regression suite.
  - Slack/GitHub integrations, webhook delivery for exports.
  - Asset upload pipeline with storage (S3/GCS) and metadata injection.
  - Pricing & billing integration (Stripe) with tier enforcement.
  - Publish docs site with quickstart guides and API reference.
- **3-month Scale Milestones**
  - Multi-tenant queue with autoscaling workers on Kubernetes.
  - Render pipeline presets, platform toggles, and agent-driven prompt builder.
  - Enterprise security features (SSO, audit logs, VPC deployment automation).
  - Analytics module: export success rates, asset usage insights, cohort retention.
  - Customer advisory board + case study program.

## 6. Go-to-Market Collateral Drafts
### Landing Page Copy
**Headline:** "Ship Unity worlds in minutes with agent-ready exports."

**Subhead:** "Automate scene scaffolding, enforce studio standards, and let your agents deliver production-ready Unity projects."

**Call-to-action buttons:** "Get Early Access" and "Run an Export"

**Key sections:**
1. **Production-ready scaffolds** – "Generate Unity LTS projects with render pipeline presets, scene validation, and asset wiring."
2. **Built for human + agent teams** – "Trigger exports via API, CLI, or chatops. Every job includes manifests, metrics, and replay metadata."
3. **Integrate your stack** – Logos + copy for GitHub, Slack, Linear, Unreal (coming soon).
4. **Security & compliance** – "SOC2 roadmap, SSO, role-based access, and private cloud options."
5. **Testimonials** – Quotes from indie studio, enterprise prototyper, agent framework maintainer.
6. **Pricing teaser** – Three cards highlighting Free, Pro, Enterprise tiers with CTA to contact sales.

### API Documentation Structure
1. **Overview** – service description, authentication, rate limits.
2. **Quickstart** – curl, JS/TS, Python examples.
3. **Export Endpoints** – `/export` (sync), `/exports` (list), `/exports/{id}` (status), `/exports/{id}/download`.
4. **Assets API** – `/assets` upload, `/assets/{id}` metadata, linking assets to exports.
5. **Integrations** – Slack, GitHub Actions, agent framework recipes.
6. **Webhooks** – event types, payload schemas, retry/backoff policy.
7. **Manifests & Templates** – render pipeline presets, version matrix, customization guides.
8. **Errors & Troubleshooting** – codes, recovery steps, support channels.

### Demo Video Script (90 seconds)
1. **Hook (0-15s)** – Show cluttered Unity template folder vs. one-click export; narrator introduces "Unity Exporter".
2. **Setup (15-40s)** – Live run of CLI/API request, highlight metadata options and optional asset uploads.
3. **Delivery (40-65s)** – Reveal generated Unity project in Finder, open in Unity, scene auto-configured with assets.
4. **Agent Angle (65-80s)** – Show chat agent triggering an export and posting download link in Slack.
5. **Close (80-90s)** – Pricing tiers slide + CTA "Join the Early Access waitlist".
