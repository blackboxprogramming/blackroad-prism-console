import { Link } from 'react-router-dom'

const FEATURE_CARDS = [
  {
    eyebrow: 'Build',
    title: 'High velocity dev + ops',
    body:
      'Lucidia IDE pairs with agents that plan sprints, review diffs, and keep every environment in sync.',
    bullets: [
      'Branch-aware code reviews with automatic merges',
      'Integrated observability and incident playbooks',
      'Ship web, native, and game builds side-by-side',
    ],
  },
  {
    eyebrow: 'Create',
    title: 'Scene-to-screen pipelines',
    body:
      'RoadView stitches simulations, edit bays, and interactive exports so every prompt can premiere instantly.',
    bullets: [
      'Multi-track timeline with version snapshots',
      'GPU render bursts streamed under 3 seconds',
      'Export to broadcast, social, or in-world builds',
    ],
  },
  {
    eyebrow: 'Monetize',
    title: 'Wallets, splits, and funding',
    body:
      'Built-in commerce handles tips, subscriptions, licensing, and instant payouts across global teams.',
    bullets: [
      'Programmable revenue splits per asset bundle',
      'Fiat + stablecoin rails with compliance baked in',
      'Funding brief highlights traction + forecast',
    ],
  },
]

const PIPELINE_POINTS = [
  {
    title: 'Start projects faster',
    description:
      'Creator onboarding, templates, and policy guardrails launch in under 5 minutes.',
  },
  {
    title: 'Stack projects & ATV',
    description: 'Blend memberships, drops, and brand work with automated accounting.',
  },
  {
    title: 'Built for scale',
    description: 'Segment cohorts, run A/B creative experiments, and forecast demand with live data.',
  },
  {
    title: 'Guardian ready',
    description: 'Trust, compliance, and safety agents monitor every surface in real-time.',
  },
]

const STATUS_METRICS = [
  { label: 'Avg. build deploy', value: '12m', tone: 'text-emerald-300' },
  { label: 'Creator payout time', value: '< 60s', tone: 'text-brand-gold' },
  { label: 'Ops interventions', value: 'Automated', tone: 'text-brand-blue' },
]

const PORTAL_PREVIEW = [
  {
    title: 'RoadView story desk',
    description:
      'Run creative reviews, mark selects, and spin up auto-edits with frame-perfect control and clip intelligence.',
    badge: { label: 'Version sync', tone: 'text-brand-blue', bg: 'bg-brand-blue/15' },
  },
  {
    title: 'Agent feed',
    description:
      'Follow decisions from Lucidia, Guardian, and finance bots with full audit trails and human-in-the-loop controls.',
    badge: { label: 'Real-time', tone: 'text-brand-pink', bg: 'bg-brand-pink/15' },
  },
  {
    title: 'Creator CRM',
    description:
      'Manage drops, memberships, and campaigns with automated payouts and clear revenue forecasting.',
    badge: { label: 'Commerce ready', tone: 'text-brand-gold', bg: 'bg-brand-gold/15' },
  },
]

const PRICING = [
  {
    name: 'Starter',
    price: '$0',
    description: 'For solo builders launching their first portal.',
    perks: ['Creator-OS workspace', 'RoadView previews', '5GB asset vault'],
    cta: { label: 'Start free', href: 'https://app.blackroad.io/signup', variant: 'outline' },
  },
  {
    name: 'Studio',
    price: '$49',
    suffix: '/seat',
    description: 'For teams orchestrating multi-surface launches.',
    perks: [
      'Shared ops graph & automations',
      'GPU render minutes + sim bursts',
      'Wallets with programmable splits',
    ],
    cta: { label: 'Talk to sales', href: 'mailto:studio@blackroad.io', variant: 'solid' },
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Purpose-built for networks, campuses, and partners.',
    perks: [
      'Dedicated Guardian & compliance lanes',
      'Embedded ops and integrations squad',
      'Private data residency & support',
    ],
    cta: { label: 'Schedule briefing', href: 'mailto:partners@blackroad.io', variant: 'outline' },
  },
]

const SUPPORT_LINKS = [
  {
    title: 'Docs & research',
    description: 'Browse how-to guides, API references, and live experiments.',
    href: '/docs',
    label: 'Explore docs →',
  },
  {
    title: 'Status desk',
    description: 'Realtime health, incidents, and change history across services.',
    href: '/status',
    label: 'View status →',
  },
  {
    title: 'Creator community',
    description: 'Join weekly syncs, beta drops, and partner spotlight sessions.',
    href: 'mailto:community@blackroad.io',
    label: 'Request invite →',
  },
]

const CODE_SNIPPET = `import { Client } from '@blackroad/prism'

const client = new Client({
  token: process.env.BLACKROAD_TOKEN,
  workspace: 'creator-os',
})

await client.brief.send({
  title: 'Launch RoadShow',
  payload: {
    script: 'v4.2',
    channels: ['portal', 'broadcast'],
  },
})

await client.portal.publish()`

function GradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 right-10 h-96 w-96 rounded-full bg-brand-pink/40 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 h-96 w-[32rem] -translate-x-1/2 rounded-full bg-brand-blue/30 blur-3xl" />
    </div>
  )
}

function FeatureCard({ eyebrow, title, body, bullets }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/80 p-6 shadow-lg shadow-black/40">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-brand-blue">{eyebrow}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-slate-300">{body}</p>
      <ul className="space-y-2 text-sm text-slate-400">
        {bullets.map((bullet) => (
          <li key={bullet}>• {bullet}</li>
        ))}
      </ul>
    </article>
  )
}

function PricingCard({ name, price, suffix, description, perks, cta, featured }) {
  const wrapperClass = featured
    ? 'bg-gradient-to-br from-brand-pink/15 via-brand-gold/10 to-brand-blue/15 border-brand-pink/40 shadow-brand-pink/40'
    : 'bg-slate-900/80 border-white/10 shadow-black/40'

  return (
    <article
      className={`flex h-full flex-col gap-4 rounded-3xl border p-6 shadow-lg ${wrapperClass}`}
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <p className="text-3xl font-semibold text-white">
        {price}
        {suffix ? <span className="text-base font-medium text-slate-200">{suffix}</span> : null}
      </p>
      <ul className={`space-y-2 text-sm ${featured ? 'text-slate-100' : 'text-slate-300'}`}>
        {perks.map((perk) => (
          <li key={perk}>• {perk}</li>
        ))}
      </ul>
      <a
        className={
          cta.variant === 'solid'
            ? 'mt-auto inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200'
            : 'mt-auto inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5'
        }
        href={cta.href}
      >
        {cta.label}
      </a>
    </article>
  )
}

export default function Desktop() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <GradientBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 shadow-xl shadow-black/40 backdrop-blur">
          <a className="flex items-center gap-3" href="#top">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-pink via-brand-gold to-brand-blue text-lg font-semibold text-slate-950">
              BR
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue">BlackRoad</p>
              <p className="text-xs text-slate-400">Creator-OS</p>
            </div>
          </a>
          <div className="flex flex-1 flex-wrap items-center justify-center gap-3 text-sm text-slate-300 sm:justify-end">
            <a className="rounded-lg px-3 py-2 font-medium hover:text-white" href="#features">
              Features
            </a>
            <a className="rounded-lg px-3 py-2 font-medium hover:text-white" href="/docs">
              Docs
            </a>
            <Link className="rounded-lg px-3 py-2 font-medium hover:text-white" to="/chat">
              Portal
            </Link>
            <a className="rounded-lg px-3 py-2 font-medium hover:text-white" href="#pricing">
              Pricing
            </a>
            <a className="rounded-lg px-3 py-2 font-medium hover:text-white" href="#support">
              Support
            </a>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            API healthy · <span className="text-white">32ms</span>
          </span>
        </nav>

        <header
          id="top"
          className="mt-16 grid gap-12 rounded-3xl border border-white/5 bg-slate-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-lg md:grid-cols-[1.4fr_1fr]"
        >
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.3em] text-brand-blue">
              Applied multi-agent studio
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">Welcome to BlackRoad</h1>
              <p className="max-w-xl text-lg text-slate-300">
                Ship video, software, and live experiences from a single workspace. The BlackRoad Creator-OS links multi-agent workflows, simulation, and revenue so teams can move from concept to launch in minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-2xl bg-gradient-to-r from-brand-pink via-brand-gold to-brand-blue px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-brand-pink/40 transition hover:-translate-y-0.5 hover:shadow-xl"
                to="/chat"
              >
                Enter Portal
              </Link>
              <Link
                className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                to="/roadview"
              >
                Enable RoadView
              </Link>
              <a
                className="rounded-2xl border border-brand-blue/40 px-5 py-3 text-sm font-semibold text-brand-blue transition hover:border-brand-blue/60 hover:bg-brand-blue/10"
                href="#new-work"
              >
                Meet New Work
              </a>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Quick brief</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>🚀 Launch-ready portals, docs, and knowledge flows</li>
                <li>🧠 Agent mesh tuned for creative, ops, and finance teams</li>
                <li>💸 Built-in wallets, splits, and usage-based billing</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-5 text-sm text-slate-400">
              <p className="font-semibold uppercase tracking-wide text-slate-300">Signal</p>
              <p className="mt-3 text-slate-200">100+ launches · 24/7 ops coverage · 35 countries live</p>
            </div>
          </div>
        </header>

        <section id="features" className="mt-16 space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Focused features for builders</h2>
              <p className="text-sm text-slate-400">Everything you need to design, ship, and scale ambitious productions.</p>
            </div>
            <a className="text-sm font-semibold text-brand-blue hover:text-brand-gold" href="/docs/guide/getting-started">
              View product overview →
            </a>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section id="new-work" className="mt-16 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <article className="rounded-3xl border border-white/5 bg-slate-900/80 p-6 shadow-lg shadow-black/40">
            <h2 className="text-xl font-semibold text-white">Creator pipeline &amp; funding brief</h2>
            <p className="mt-3 text-sm text-slate-300">
              Give partners a live look at roadmap, metrics, and deal flow. RoadShow mode transforms updates into shareable stories.
            </p>
            <dl className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
              {PIPELINE_POINTS.map(({ title, description }) => (
                <div key={title}>
                  <dt className="font-semibold text-white">{title}</dt>
                  <dd className="mt-1 text-slate-400">{description}</dd>
                </div>
              ))}
            </dl>
          </article>
          <aside className="flex flex-col justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/80 p-6 shadow-lg shadow-black/40">
            <div>
              <h2 className="text-xl font-semibold text-white">Status pulses</h2>
              <p className="mt-2 text-sm text-slate-400">Key metrics refresh from your ops graph.</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {STATUS_METRICS.map(({ label, value, tone }) => (
                  <li key={label} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                    <span>{label}</span>
                    <span className={`font-semibold ${tone}`}>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-brand-pink/60 hover:bg-brand-pink/10"
              href="mailto:team@blackroad.io"
            >
              Request briefing deck →
            </a>
          </aside>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/5 bg-slate-900/80 p-6 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">API Quickstart</h2>
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-blue">
                5 min setup
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Automate ingest, ops hand-offs, and live story playback with a single authenticated client.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-2xl bg-slate-950/80 p-6 text-sm text-slate-200 shadow-inner shadow-black/40">
              {CODE_SNIPPET}
            </pre>
          </article>
          <aside className="flex h-full flex-col gap-5 rounded-3xl border border-white/5 bg-slate-900/80 p-6 shadow-lg shadow-black/40">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Join the beta</h2>
              <p className="text-sm text-slate-300">
                Cohorts open monthly for studios, educators, and frontier labs. We tailor the agent mesh to your workflows.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• 1:1 onboarding session with the ops crew</li>
              <li>• Dedicated Guardian safety review</li>
              <li>• Migration support for repos + media</li>
            </ul>
            <a
              className="mt-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-pink via-brand-gold to-brand-blue px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-brand-pink/40 transition hover:-translate-y-0.5"
              href="https://blackroad.typeform.com/to/portal"
            >
              Apply for access
            </a>
          </aside>
        </section>

        <section className="mt-16 space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Portal preview</h2>
              <p className="text-sm text-slate-400">Live dashboards, AI copilots, and publishing pipelines in one place.</p>
            </div>
            <Link className="text-sm font-semibold text-brand-blue hover:text-brand-gold" to="/chat">
              Launch interactive demo →
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {PORTAL_PREVIEW.map(({ title, description, badge }) => (
              <article key={title} className="space-y-3 rounded-3xl border border-white/5 bg-white/5 p-6 shadow-lg shadow-black/40">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-300">{description}</p>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badge.bg} ${badge.tone}`}>
                  {badge.label}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="mt-16 space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Simple, transparent options</h2>
              <p className="text-sm text-slate-400">Every plan includes multi-agent ops, RoadView, and wallet infrastructure.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
              Monthly &amp; annual pricing
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {PRICING.map((tier) => (
              <PricingCard key={tier.name} {...tier} />
            ))}
          </div>
        </section>

        <section id="support" className="mt-16 grid gap-6 lg:grid-cols-3">
          {SUPPORT_LINKS.map(({ title, description, href, label }) => (
            <article key={title} className="rounded-3xl border border-white/5 bg-slate-900/80 p-6 shadow-lg shadow-black/40">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-300">{description}</p>
              <a className="mt-4 inline-flex items-center text-sm font-semibold text-brand-blue hover:text-brand-gold" href={href}>
                {label}
              </a>
            </article>
          ))}
        </section>

        <footer className="mt-20 flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/80 px-6 py-5 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} BlackRoad Labs. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a className="hover:text-white" href="/privacy">
              Privacy
            </a>
            <a className="hover:text-white" href="/terms">
              Terms
            </a>
            <a className="hover:text-white" href="mailto:hello@blackroad.io">
              Contact
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
