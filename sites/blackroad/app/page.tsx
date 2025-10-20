import Link from "next/link";

const features = [
  {
    title: "Agent-Ready Stack",
    description: "Cards, inputs, and actions styled for clarity. Wire your agents to a consistent UI.",
  },
  {
    title: "High Contrast & A11y",
    description: "Meets a minimum 4.5:1 contrast ratio with clear focus states and predictable hover.",
  },
  {
    title: "Built for Code",
    description: "Monospace defaults, tight line-height, compact spacing: optimized for dev surfaces.",
  },
];

const pricingTiers = [
  { name: "Starter", price: "$0", features: ["Core UI, docs, and local workflows."] },
  { name: "Pro", price: "$20/mo", features: ["Portal, agents, and automation routes."] },
  { name: "Enterprise", price: "Contact", features: ["Custom deployments and advanced controls."] },
];

export default function Home() {
  return (
    <>
      <section className="container-x py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm tracking-wide text-zinc-400">HELLO, WORLD!</p>
          <h1 className="h1">
            Build, ship, and evolve — on a
            {" "}
            <span className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              dark, precise
            </span>{" "}
            stack.
          </h1>
          <p className="mt-5 text-lg text-zinc-400">
            A developer-focused environment for real-time co-coding, agents, and automation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/portal">
              Launch Portal
            </Link>
            <Link className="btn-ghost" href="#docs">
              Read the Docs
            </Link>
            <Link className="btn-ghost" href="#investor">
              Investor Relations
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="container-x grid gap-5 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="card">
            <h3 className="h2 mb-2">{feature.title}</h3>
            <p className="text-zinc-400">{feature.description}</p>
          </div>
        ))}
      </section>

      <section id="investor" className="container-x mt-12 grid gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="h2">Investor relations & funding brief</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-zinc-400">
            <li>
              Current raise: <strong>$8.5M seed extension</strong> (SAFE caps available).
            </li>
            <li>
              Deployment: <strong>18-month runway</strong>, platform, security, GTM pilots.
            </li>
            <li>
              Milestones: <strong>Q3 2025</strong> enterprise portal, SOC 2 Type I.
            </li>
          </ul>
          <div className="mt-5 flex gap-3">
            <Link className="btn-primary" href="/investor/contact">
              Contact Investor Team
            </Link>
            <Link className="btn-ghost" href="/investor/brief.pdf">
              Download Brief
            </Link>
          </div>
        </div>
        <div className="card">
          <h4 className="font-semibold">Investor resources</h4>
          <p className="mt-2 text-zinc-400">
            Access diligence materials, compliance, and office hours through the BlackRoad Hub.
          </p>
          <Link className="btn-ghost mt-4 inline-block" href="/data-room">
            Open data room
          </Link>
        </div>
      </section>

      <section id="docs" className="container-x mt-12 grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h3 className="h2">API Quickstart</h3>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink-800/90 p-4 text-sm text-zinc-300">
            {`// client.js
import fetch from 'node-fetch';

async function chat(prompt) {
  const res = await fetch('https://blackroad.io/api/llm/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error(\`Request failed: ${'$'}{res.status}\`);
  return res.text();
}

chat('Hello, BlackRoad');`}
          </pre>
        </div>
        <div className="card">
          <h3 className="h2">Join the Beta</h3>
          <p className="mt-2 text-zinc-400">
            Request access to the co-coding portal. We’ll reach out with credentials.
          </p>
          <form className="mt-4 space-y-3">
            <input className="w-full rounded-xl bg-ink-700/70 px-3 py-2" placeholder="Email" />
            <input className="w-full rounded-xl bg-ink-700/70 px-3 py-2" placeholder="Name (optional)" />
            <button className="btn-primary w-full" type="submit">
              Request Access
            </button>
          </form>
        </div>
      </section>

      <section id="pricing" className="container-x mt-12 grid gap-5 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <div key={tier.name} className="card">
            <h3 className="h2">{tier.name}</h3>
            <div className="mt-1 text-3xl font-semibold">{tier.price}</div>
            <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-400">
              {tier.features.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="btn-primary mt-6 inline-block" href={tier.name === "Enterprise" ? "/contact" : "/signup"}>
              {tier.name === "Enterprise" ? "Talk to us" : tier.name === "Pro" ? "Upgrade" : "Get Started"}
            </Link>
          </div>
        ))}
      </section>
    </>
  );
}
