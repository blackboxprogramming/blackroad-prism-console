import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { localeFromPath, setLocale, t, withPrefix } from '../lib/i18n.ts'
import { logToWorker } from '../lib/logger.ts'
import { recordConversion } from '../lib/convert.ts'

const proofBlocks = [
  {
    id: 'build',
    title: 'Build Together',
    outcome:
      'Code and media flow in one workspace so teams can script features, frame scenes, and review inline in minutes.',
    image: '/img/proof-build.svg',
    alt: 'Creator-OS workspace showing code panel, storyboard timeline, and chat shipping a preview',
    receipts: [
      'Sub-200ms agent replies inside shared repos',
      'Branch-aware IDE, storyboard, and asset vault',
      'Shipped 100+ creator releases last quarter',
    ],
  },
  {
    id: 'agents',
    title: 'Multi-Agent Ops',
    outcome:
      'Roadie, Guardian, and Lucidia automate review, ops, and finance so you stay focused on shipping.',
    image: '/img/proof-agents.svg',
    alt: 'Roadie, Guardian, and Lucidia dashboards linked by workflow signals',
    receipts: [
      '24/7 code review, release, and compliance runs',
      'Guardian patches drift before it hits prod',
      'Lucidia reconciles tips, splits, and payouts automatically',
    ],
  },
  {
    id: 'simulation',
    title: 'Sim-to-Studio',
    outcome:
      'Spin up physics-grade scenes, iterate in real time, and export footage or interactive builds without leaving chat.',
    image: '/img/proof-simulation.svg',
    alt: 'Sim-to-studio pipeline from 3D scene capture to GPU render and export cards',
    receipts: [
      'Unity & Unreal pipelines pre-integrated',
      'GPU burst renders streamed under 3 seconds',
      'Scene-to-video and playable export in one click',
    ],
  },
  {
    id: 'money',
    title: 'Native Money',
    outcome:
      'Creator Wallet handles tipping, revenue splits, and payouts so every project launches with a business model.',
    image: '/img/proof-money.svg',
    alt: 'Creator Wallet panels summarizing instant settlement, splits, and payout schedule',
    receipts: [
      'Self-custodied wallet with instant settlement',
      'Programmable revenue splits per asset bundle',
      'Supports USD, stablecoins, and creator tokens',
    ],
  },
]

const howItWorks = [
  {
    title: 'Start',
    description: 'Spin up a Creator-OS workspace, invite collaborators, and link your repos, scenes, and channels.',
  },
  {
    title: 'Create',
    description:
      'Co-build code, media, and simulations with agents that prep assets, run tests, and tune renders automatically.',
  },
  {
    title: 'Publish',
    description: 'Ship to web, app stores, or marketplaces with built-in wallets, analytics, and post-launch automation.',
  },
]

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Personal Creator-OS with local agents and 5GB asset storage.',
  },
  {
    name: 'Pro',
    price: '$39',
    description: 'Cloud agent fleet, GPU renders, and production-grade publishing for teams.',
  },
  {
    name: 'Studio',
    price: 'Let’s talk',
    description: 'Dedicated ops graph, custom compliance, and revenue-partner tooling.',
  },
]

const faqs = [
  {
    question: 'What is BlackRoad?',
    answer: 'BlackRoad is a Creator-OS for code + media—one place to build products, video, and games with agent help.',
  },
  {
    question: 'Can I use my own repos?',
    answer: 'Yes. Connect GitHub or GitLab, sync assets, and agents will branch, review, and merge with policy guardrails.',
  },
  {
    question: 'How do simulations work?',
    answer: 'Drop in Unity or Unreal scenes and the sim-to-studio pipeline renders videos or deploys interactive builds.',
  },
  {
    question: 'Is the wallet optional?',
    answer: 'Creator Wallet is bundled but optional—you decide when to enable tipping, splits, and payouts.',
  },
  {
    question: 'Do you support teams?',
    answer: 'Pro and Studio plans include shared workspaces, role-based access, and multi-agent orchestration.',
  },
  {
    question: 'How do I get started?',
    answer: 'Click “Start creating” to launch the Creator-OS workspace or message us for an onboarding session.',
  },
]

const heroStats = [
  { label: 'Agent response time', value: '< 200 ms' },
  { label: 'Active creator workspaces', value: '1.8K+' },
  { label: 'Creator payouts processed', value: '$12M' },
]

const heroHighlights = [
  'Branch-aware coding, storyboard, and review inside a single chat.',
  'GPU simulations stream inline so teams iterate on live scenes.',
  'Creator Wallet handles tips, splits, and instant settlement.',
]

const trustBadges = ['Trusted by frontier labs', 'Backed by realtime ops', 'Deployed to 35 countries']

const productDeck = [
  {
    name: 'Studio',
    description: 'Multi-agent coding with files, canvas, and playback all inside chat.',
    to: '/studio',
  },
  {
    name: 'Animator',
    description: 'Drop assets, storyboard, and render directly to MP4 or WebGL.',
    to: '/animator',
  },
  {
    name: 'Game Maker',
    description: 'Collect assets and export Unity or Unreal project templates instantly.',
    to: '/game',
  },
  {
    name: 'Homework',
    description: 'Research, draft, cite, and export with citations generated automatically.',
    to: '/homework',
  },
]

export default function Home() {
  const location = useLocation()
  const lang = localeFromPath(location.pathname)

  useEffect(() => {
    setLocale(lang)
  }, [lang])

  useEffect(() => {
    const url = import.meta.env.VITE_LOG_WRITE_URL
    if (url) logToWorker(url, 'info', 'home_view', { hint: 'home page mounted' })
  }, [])

  const quickLinks = [
    { label: t('coCodingPortal'), description: 'Launch the shared workspace with Roadie and Guardian on-call.', path: '/portal' },
    {
      label: `${t('status')} • ${t('snapshot')}`,
      description: 'Track platform uptime and see the latest deployment snapshot.',
      path: '/status',
      secondary: '/snapshot',
      secondaryLabel: t('snapshot'),
    },
    { label: t('docs'), description: 'Browse playbooks, API guides, and runbooks tuned for agents.', path: '/docs' },
    {
      label: t('quantumConsciousness'),
      description: 'Explore Lucidia research and the frontier models powering creation.',
      path: '/quantum-consciousness',
    },
  ]

  return (
    <main className="space-y-16">
      <section className="hero-surface relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 px-8 py-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_65%)] opacity-80" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(15,23,42,0.6)_0%,_rgba(12,74,110,0.15)_60%,_rgba(15,23,42,0.9)_100%)]" aria-hidden="true" />
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-12 md:flex-row md:items-center">
          <div className="space-y-6 md:w-1/2">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Creator-OS for code + media
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Launch code, media, and simulations with multi-agent speed.
            </h1>
            <p className="max-w-xl text-lg text-slate-200">
              Chat to ship apps, videos, and games with agents that handle review, simulation, and payouts—no context switching and no extra tabs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="btn"
                onClick={() => recordConversion('cta_click', 1, { where: 'home.start-creating' })}
                to={withPrefix('/studio', lang)}
              >
                Start creating
              </Link>
              <Link className="btn-secondary" to={withPrefix('/docs', lang)}>
                See how it works
              </Link>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <dt className="text-xl font-semibold text-white">{stat.value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-widest text-white/60">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="md:w-1/2">
            <div className="glass-panel space-y-6">
              <header>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100/80">Live production board</p>
                <h2 className="text-2xl font-semibold text-white">Every launch stays in flow</h2>
              </header>
              <ul className="space-y-3 text-sm text-slate-100/90">
                {heroHighlights.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-cyan-300" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border border-white/15 bg-white/5 p-5 text-left shadow-[0_0_40px_rgba(14,165,233,0.15)]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">Live run</p>
                <p className="mt-2 text-base font-semibold text-white">Sim-to-studio export completes in 2m 04s</p>
                <p className="mt-2 text-xs text-slate-100/70">Roadie orchestrates tests while Guardian patches drift in the repo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Launch proof</h2>
          <p className="text-lg font-medium text-slate-200">100+ Creator-OS projects shipped since Q1</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          {trustBadges.map((badge) => (
            <span key={badge} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              {badge}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-10">
        <header className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Prove the Creator-OS for code + media</h2>
          <p className="text-slate-400">Every block shows how BlackRoad turns multi-agent creation into shipped software, stories, and worlds.</p>
        </header>
        <div className="grid gap-8 md:grid-cols-2">
          {proofBlocks.map((block) => (
            <article key={block.id} className="card h-full space-y-5 bg-slate-900/40">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">{block.title}</h3>
                <p className="text-lg text-slate-100/90">{block.outcome}</p>
              </div>
              <img
                alt={block.alt}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 object-cover"
                src={block.image}
              />
              <ul className="space-y-2 text-sm text-slate-400">
                {block.receipts.map((receipt) => (
                  <li key={receipt} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />
                    <span>{receipt}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="card space-y-8">
        <header className="space-y-2 text-center text-white">
          <h2 className="text-2xl font-bold">How it works</h2>
          <p className="text-slate-400">Three steps from idea to revenue-ready launch.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Step {index + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((link) => (
            <div key={link.label} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="text-sm font-semibold text-white">{link.label}</h3>
              <p className="mt-2 text-sm text-slate-400">{link.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-cyan-300">
                <Link className="underline decoration-dotted decoration-cyan-500/60 underline-offset-4" to={withPrefix(link.path, lang)}>
                  Open {link.label}
                </Link>
                {link.secondary && (
                  <Link
                    className="underline decoration-dotted decoration-cyan-500/60 underline-offset-4"
                    to={withPrefix(link.secondary, lang)}
                  >
                    View {link.secondaryLabel ?? 'snapshot'}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-6">
        <header className="space-y-2 text-center text-white">
          <h2 className="text-2xl font-bold">Product deck</h2>
          <p className="text-slate-400">Pick the workspace that matches your next launch.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {productDeck.map((product) => (
            <div key={product.name} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="text-lg font-semibold text-white">{product.name}</h3>
              <p className="mt-3 text-sm text-slate-400">{product.description}</p>
              <Link className="btn-secondary mt-4 inline-flex items-center gap-2" to={withPrefix(product.to, lang)}>
                Explore {product.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-6" id="pricing">
        <header className="space-y-2 text-center text-white">
          <h2 className="text-2xl font-bold">Pricing</h2>
          <p className="text-slate-400">Choose the Creator-OS plan that fits your team.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div key={tier.name} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <p className="mt-2 text-3xl font-bold text-white">{tier.price}</p>
              <p className="mt-3 text-sm text-slate-400">{tier.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-6">
        <header className="space-y-2 text-center text-white">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <p className="text-slate-400">Answers to the questions creators ask first.</p>
        </header>
        <dl className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <dt className="text-base font-semibold text-white">{faq.question}</dt>
              <dd className="mt-2 text-sm text-slate-400">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-center text-white">
        <h2 className="text-3xl font-bold">Creator-OS for code + media</h2>
        <p className="mt-3 text-lg text-slate-200">
          Bring your team, plug in your stack, and let agents help you build, simulate, and publish every launch.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="btn"
            onClick={() => recordConversion('cta_click', 1, { where: 'home.final-cta' })}
            to={withPrefix('/studio', lang)}
          >
            Start creating
          </Link>
          <Link className="btn-secondary" to={withPrefix('/contact', lang)}>
            Talk to us
          </Link>
        </div>
      </section>
    </main>
  )
}
