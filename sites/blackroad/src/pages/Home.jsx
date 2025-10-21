import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { localeFromPath, withPrefix } from '../lib/i18n.ts'
import { logToWorker } from '../lib/logger.ts'
import { recordConversion } from '../lib/convert.ts'

const proofBlocks = [
  {
    id: 'build',
    title: 'Build Together',
    outcome:
      'Code and media flow in one workspace so teams can script features, frame scenes, and review inline in minutes.',
    image: '/img/proof-build.svg',
    alt: 'BlackRoad editor with timeline and chat side-by-side',
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
    alt: 'Agents coordinating across review, ops, and finance dashboards',
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
    alt: 'Simulation pipeline from 3D scene to rendered experience',
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
    alt: 'Wallet dashboard showing tips, splits, and payout schedule',
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

export default function Home() {
  const location = useLocation()
  const lang = localeFromPath(location.pathname)

  useEffect(() => {
    const url = import.meta.env.VITE_LOG_WRITE_URL
    if (url) logToWorker(url, 'info', 'home_view', { hint: 'home page mounted' })
  }, [])

  return (
    <main className="space-y-16">
      <section className="card relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.45),_transparent_60%)]" />
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-800/70 px-4 py-1 text-sm font-medium uppercase tracking-wider text-cyan-200">
            Creator-OS for code + media
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Build, simulate, and publish with multi-agent speed.
          </h1>
          <p className="max-w-2xl text-lg text-slate-100">
            Chat to ship apps, videos, and games with agents that handle review, simulation, and payouts—no context switching, no extra tabs.
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
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Launch proof</h2>
          <p className="text-lg font-medium text-slate-700">100+ Creator-OS projects shipped since Q1</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <span>Trusted by frontier labs</span>
          <span>Backed by realtime ops</span>
          <span>Deployed to 35 countries</span>
        </div>
      </section>

      <section className="space-y-8">
        <header className="space-y-3">
          <h2 className="text-2xl font-bold">Prove the Creator-OS for code + media</h2>
          <p className="text-slate-600">
            Every block shows how BlackRoad turns multi-agent creation into shipped software, stories, and worlds.
          </p>
        </header>
        <div className="grid gap-8 md:grid-cols-2">
          {proofBlocks.map((block) => (
            <article key={block.id} className="card h-full space-y-5">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">{block.title}</h3>
                <p className="text-lg text-slate-700">{block.outcome}</p>
              </div>
              <img
                alt={block.alt}
                className="w-full rounded-lg border border-slate-200 bg-white object-cover"
                src={block.image}
              />
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {block.receipts.map((receipt) => (
                  <li key={receipt}>{receipt}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="card space-y-8">
        <header className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">How it works</h2>
          <p className="text-slate-600">Three steps from idea to revenue-ready launch.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {howItWorks.map((step) => (
            <div key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">{t('explore')}</h2>
          <ul className="list-disc ml-5">
            <li><Link to={withPrefix('/portal', lang)}>{t('coCodingPortal')}</Link></li>
            <li><Link to={withPrefix('/status', lang)}>{t('status')}</Link> &nbsp; • &nbsp;<Link to={withPrefix('/snapshot', lang)}>{t('snapshot')}</Link></li>
            <li><Link to={withPrefix('/docs', lang)}>{t('docs')}</Link></li>
            <li>
              <Link to={withPrefix('/quantum-consciousness', lang)}>
                {t('quantumConsciousness')}
              </Link>
            </li>
          </ul>
      </section>

      <section className="card space-y-6" id="pricing">
        <header className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">Pricing</h2>
          <p className="text-slate-600">Choose the Creator-OS plan that fits your team.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div key={tier.name} className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">{tier.name}</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">{tier.price}</p>
              <p className="mt-3 text-sm text-slate-600">{tier.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-6">
        <header className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <p className="text-slate-600">Answers to the questions creators ask first.</p>
        </header>
        <dl className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <dt className="text-base font-semibold text-slate-800">{faq.question}</dt>
              <dd className="mt-2 text-sm text-slate-600">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card bg-slate-900 text-center text-white">
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
