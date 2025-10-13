const PATHWAYS = [
  {
    title: "Create",
    description:
      "Launch a production-ready studio in minutes. Prompt the system and watch scripts, storyboards, and assets assemble themselves.",
    bullets: [
      "Conversational onboarding with ready-to-run starter kits",
      "Real-time collaboration between you and specialized AI agents",
      "Template library tuned to every niche — adapt tone, pacing, and visuals instantly",
    ],
    cta: { label: "Start building", href: "/chat" },
  },
  {
    title: "Build",
    description:
      "Ship code, games, and simulations without juggling dozens of disconnected tools. Lucidia, Genesis Road, and RoadView share one brain.",
    bullets: [
      "Voice-to-code IDE with guardrails and instant previews",
      "Natural language game engine that composes physics, AI, and art",
      "Unified analytics so every iteration learns from the last",
    ],
    cta: { label: "Explore the stack", href: "/roadview" },
  },
  {
    title: "Learn",
    description:
      "Guided paths turn research into mastery. Study cohorts, interactive labs, and certification tie directly into your live projects.",
    bullets: [
      "20-week learning paths spanning creative, technical, and business tracks",
      "Interactive labs with auto-feedback and community reviews",
      "RoadCoin rewards for teaching, mentoring, and publishing research",
    ],
    cta: { label: "Enter the Academy", href: "/status" },
  },
];

const EMPATHY_GRID = [
  {
    name: "Sarah · Filmmaker",
    pain: "Spent 14 tools and $3k/year to launch a pilot episode.",
    promise: "BlackRoad shipped her next series from a single AI-guided hub in 28 minutes.",
  },
  {
    name: "Jae · Solo Developer",
    pain: "Lost momentum switching between Git, Unity, analytics, and docs.",
    promise: "Lucidia and Genesis Road deploy playable builds on every prompt.",
  },
  {
    name: "Amara · Educator",
    pain: "Course tooling fragmented across LMS, forums, grading, and CRM.",
    promise: "BlackRoad Academy stitched content, homework, and payments into one flow.",
  },
  {
    name: "Noah · Studio Lead",
    pain: "Couldn’t scale ops — hiring, finance, and IP protection were disconnected silos.",
    promise: "Business Suite agents now automate onboarding, payroll, and compliance.",
  },
];

const DEEP_DIVES = [
  {
    title: "RoadView Studio",
    stat: "10× faster video iterations",
    description:
      "Prompt-to-premiere pipeline with live thumbnail experiments, multi-format export, and revenue-ready ad slots.",
  },
  {
    title: "Lucidia Code Portal",
    stat: "95% intent-to-build accuracy",
    description:
      "Voice-coded IDE that learns your patterns, keeps repos synchronized, and reasons over your knowledge base.",
  },
  {
    title: "Genesis Road Engine",
    stat: "60-minute playable prototypes",
    description:
      "Natural language 3D/world builder with physics, NPC brains, and asset licensing wired into RoadCoin commerce.",
  },
  {
    title: "Business Ops Suite",
    stat: "70% revenue retention",
    description:
      "CRM, finance, and legal autopilot. Every transaction clears in RoadCoin or fiat with transparent splits.",
  },
];

const ECONOMY_FLOWS = [
  "Publish in RoadView and launch optional creator-run ad inventory.",
  "Offer assets, code, and templates in the marketplace with programmable royalties.",
  "Reward your community instantly — tipping, patronage, or gated drops in RoadCoin.",
  "Spin up courses and APIs with built-in DRM and usage-based billing.",
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    description: "Prototype with daily limits and access to core agents.",
    perks: [
      "Conversational onboarding",
      "RoadView basic export",
      "Community access",
    ],
  },
  {
    name: "Creator",
    price: "$29",
    description: "Unlimited creative suite, monetization tools, and audience CRM.",
    highlight: true,
    perks: [
      "Unlimited generation and exports",
      "Integrated analytics and split testing",
      "RoadCoin wallet + instant payouts",
    ],
  },
  {
    name: "Business",
    price: "$99",
    description: "Operational agents, finance automation, and team workspaces.",
    perks: [
      "Advanced task orchestration",
      "Legal and HR automations",
      "Priority support + compliance reporting",
    ],
  },
  {
    name: "Enterprise",
    price: "Let’s talk",
    description: "Private models, custom agents, and white-label deployments.",
    perks: [
      "Dedicated success squad",
      "Sovereign data residency options",
      "Platform roadmap influence",
    ],
  },
];

const ROADMAP = [
  {
    phase: "Phase 1 · MVP",
    timeline: "Q1 – Q2 2026",
    focus: "RoadView, Lucidia, conversational shell, RoadCoin beta",
    kpi: "1K creators · 80% retention",
  },
  {
    phase: "Phase 2 · Creative Expansion",
    timeline: "Q3 – Q4 2026",
    focus: "Genesis Road + Design Studio, AI assistive loop",
    kpi: "10× iteration speed validated",
  },
  {
    phase: "Phase 3 · Business Layer",
    timeline: "Q1 – Q2 2027",
    focus: "Ops suite, legal/finance agents, RoadCoin liquidity",
    kpi: "$1M RoadCoin TVL",
  },
  {
    phase: "Phase 4 · Knowledge Ecosystem",
    timeline: "Q3 – Q4 2027",
    focus: "Academy launch, research ingestion, collaborative labs",
    kpi: "5K courses · 20% engagement",
  },
  {
    phase: "Phase 5 · Scale",
    timeline: "2028+",
    focus: "Extensibility APIs, enterprise deployments, global partners",
    kpi: "$10M ARR · 100K creators",
  },
];

const TESTIMONIALS = [
  {
    quote: "“BlackRoad replaced 17 tools and gave me back my weekends.”",
    name: "Mira — Narrative Designer",
  },
  {
    quote: "“We prototyped a fully playable vertical slice in 54 minutes.”",
    name: "Atlas Forge Studio",
  },
  {
    quote: "“Students finally learn and ship in the same space. My drop-out rate fell by 60%.”",
    name: "Prof. Delgado — Quantum Academy",
  },
];

export default function Desktop() {
  return (
    <div className="min-h-screen bg-[#05070F] text-white">
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-40 h-72 w-72 rounded-full bg-[#FF4FD8]/30 blur-3xl" />
          <div className="absolute top-24 -right-32 h-80 w-80 rounded-full bg-[#0096FF]/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 translate-x-1/2 rounded-full bg-[#FDBA2D]/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 pt-24 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
              BLACKROAD MASTER VISION
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Stop learning tools.<br className="hidden md:block" /> Start creating.
            </h1>
            <p className="max-w-xl text-lg text-slate-300">
              Everything inside BlackRoad flows from one conversation. Ideate, prototype, launch,
              and monetize without hopping between 14 different platforms. Cut setup time from 630
              hours to under 30 minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              <a className="btn" href="/chat">
                Talk to the platform
              </a>
              <a className="btn-secondary" href="#pricing">
                View pricing
              </a>
            </div>
            <dl className="grid gap-4 pt-6 text-sm text-slate-300 md:grid-cols-3">
              <div>
                <dt className="font-semibold text-white">10×</dt>
                <dd>Average production speed increase</dd>
              </div>
              <div>
                <dt className="font-semibold text-white">70%</dt>
                <dd>Revenue retained by creators</dd>
              </div>
              <div>
                <dt className="font-semibold text-white">Q2 2026</dt>
                <dd>MVP launch timeline</dd>
              </div>
            </dl>
          </div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-lg font-semibold text-white">Creator flow — before vs. after</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-200">
              <div>
                <p className="font-semibold text-white">Fragmented Stack</p>
                <p>14 logins · $3.2k/year · 630 hours before first revenue.</p>
              </div>
              <div>
                <p className="font-semibold text-white">BlackRoad Unified</p>
                <p>Single conversation · auto-orchestrated workflows · revenue in minutes.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Primary principle</p>
                <p className="mt-2 text-base font-semibold text-white">
                  Natural language is the operating system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="border-t border-white/5 bg-[#070B18]/90 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Paths</p>
              <h2 className="mt-3 text-3xl font-bold">Choose how you enter the BlackRoad ecosystem</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PATHWAYS.map((path) => (
                <article
                  key={path.title}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                >
                  <header className="space-y-2">
                    <h3 className="text-2xl font-semibold">{path.title}</h3>
                    <p className="text-sm text-slate-300">{path.description}</p>
                  </header>
                  <ul className="flex flex-1 list-disc flex-col gap-2 pl-5 text-sm text-slate-200/90">
                    {path.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a className="link-cta text-sm font-semibold" href={path.cta.href}>
                    {path.cta.label} →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#05070F] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Empathy Grid</p>
                <h2 className="mt-3 text-3xl font-bold">Creators shouldn’t burn out just to ship</h2>
                <p className="mt-4 max-w-xl text-slate-300">
                  We mapped every bottleneck in the creator lifecycle. BlackRoad responds with guided
                  AI agents, unified workspaces, and a native economy so momentum never stalls.
                </p>
              </div>
              <div className="grid gap-4 text-sm">
                {EMPATHY_GRID.map((persona) => (
                  <div key={persona.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{persona.name}</p>
                    <p className="mt-2 font-semibold text-white">{persona.pain}</p>
                    <p className="mt-2 text-slate-300">{persona.promise}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-[#070B18]/90 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Suites</p>
              <h2 className="mt-3 text-3xl font-bold">One platform that replaces 47 disconnected tools</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {DEEP_DIVES.map((suite) => (
                <article
                  key={suite.title}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-6"
                >
                  <header className="flex items-baseline justify-between gap-4">
                    <h3 className="text-2xl font-semibold">{suite.title}</h3>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#FDBA2D]">
                      {suite.stat}
                    </span>
                  </header>
                  <p className="mt-3 text-sm text-slate-200">{suite.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#05070F] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Economy</p>
                <h2 className="mt-3 text-3xl font-bold">RoadCoin keeps value circulating with creators</h2>
                <p className="mt-4 max-w-xl text-slate-300">
                  Four native monetization streams compound into sustainable revenue. Instant
                  settlement, transparent splits, and programmable royalties ensure you own the
                  upside.
                </p>
                <ul className="mt-6 grid gap-3 text-sm text-slate-200">
                  {ECONOMY_FLOWS.map((step) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#FF4FD8]" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
                <h3 className="text-lg font-semibold text-white">Revenue Simulation</h3>
                <p className="mt-2 text-slate-300">
                  A single coffee-brewing tutorial with 10K monthly viewers yields $880:
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex justify-between">
                    <span>Ad inventory (70%)</span>
                    <span className="font-semibold text-white">$350</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Tips & patronage</span>
                    <span className="font-semibold text-white">$200</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Asset licensing</span>
                    <span className="font-semibold text-white">$130</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Course/API access</span>
                    <span className="font-semibold text-white">$500</span>
                  </li>
                </ul>
                <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
                  2.5× revenue retention vs. legacy platforms
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-[#070B18]/90 py-20" id="pricing">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Pricing</p>
              <h2 className="mt-3 text-3xl font-bold">Scale from your first prototype to a full studio</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {PRICING.map((tier) => (
                <article
                  key={tier.name}
                  className={`flex h-full flex-col gap-4 rounded-2xl border border-white/10 p-6 ${
                    tier.highlight ? "bg-[#FF4FD8]/10" : "bg-white/5"
                  }`}
                >
                  <header>
                    <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
                    <p className="mt-1 text-sm text-slate-300">{tier.description}</p>
                    <p className="mt-4 text-3xl font-bold text-white">{tier.price}</p>
                  </header>
                  <ul className="flex flex-1 list-disc flex-col gap-2 pl-5 text-sm text-slate-200">
                    {tier.perks.map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                  <a className="link-cta text-sm font-semibold" href="/subscribe">
                    Talk to sales →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#05070F] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Knowledge</p>
                <h2 className="mt-3 text-3xl font-bold">BlackRoad Academy + Research Hub</h2>
                <p className="mt-4 max-w-xl text-slate-300">
                  5,000+ hours of guided curricula feed directly into hands-on projects. The research
                  repository powers 30% of our platform intelligence — every whitepaper, dataset, and
                  model becomes fuel for your agents.
                </p>
                <ul className="mt-6 grid gap-3 text-sm text-slate-200">
                  <li>Interactive coursework with auto-graded labs and peer reviews.</li>
                  <li>Research graph linking theory to in-product demos and simulations.</li>
                  <li>Earn RoadCoin by publishing, reviewing, and mentoring.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
                <h3 className="text-lg font-semibold text-white">Repository Blueprint</h3>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/60 p-4 text-xs text-slate-300">
{`/BlackRoad-Research
  /AI-ML → Model optimization, Lucidia playbooks
  /Creator-Economy → Monetization strategies, retention data
  /Design → Cognitive load studies powering predictive UI`}
                </pre>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                  Theoretical rigor meets practical application.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-[#070B18]/90 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Roadmap</p>
              <h2 className="mt-3 text-3xl font-bold">Phased execution with measurable milestones</h2>
            </div>
            <div className="mt-10 grid gap-4">
              {ROADMAP.map((phase) => (
                <div
                  key={phase.phase}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{phase.timeline}</p>
                    <p className="text-lg font-semibold text-white">{phase.phase}</p>
                  </div>
                  <p className="max-w-lg text-slate-300">{phase.focus}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#FDBA2D]">
                    {phase.kpi}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#05070F] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Proof</p>
              <h2 className="mt-3 text-3xl font-bold">Creators already feel the difference</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((item) => (
                <blockquote key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-base text-slate-100">{item.quote}</p>
                  <footer className="mt-4 text-xs uppercase tracking-wide text-slate-400">
                    {item.name}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-[#070B18]/95 py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Next Steps</p>
            <h2 className="mt-3 text-4xl font-bold">
              Ready to help us build the creator operating system?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Join the founding cohort, contribute research, or co-create the initial product suite.
              BlackRoad is the master vision that unifies creation, monetization, and learning for the
              next generation of builders.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a className="btn" href="mailto:hello@blackroad.io">
                Partner with BlackRoad
              </a>
              <a className="btn-secondary" href="/subscribe">
                Join the waitlist
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#04060C] py-12 text-sm text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="brand-gradient text-lg font-semibold">BlackRoad.io</p>
            <p className="mt-2 text-xs uppercase tracking-wide">Conversation-first creation.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs uppercase tracking-wide">
            <a className="hover:text-slate-200" href="/roadmap">
              Roadmap
            </a>
            <a className="hover:text-slate-200" href="/blog">
              Blog
            </a>
            <a className="hover:text-slate-200" href="/docs">
              Docs
            </a>
            <a className="hover:text-slate-200" href="/support">
              Support
            </a>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} BlackRoad Labs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
