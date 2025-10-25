import Link from "next/link";

type Tile = { key: string; title: string; blurb: string; href: string; status: "live" | "stub" };

const tiles: Tile[] = [
  { key: "roadbook", title: "Roadbook", blurb: "Projects, notes, and flows.", href: "/portal/roadbook", status: "stub" },
  { key: "roadview", title: "Roadview", blurb: "Live journey streams on a globe.", href: "/portal/roadview/index.html", status: "live" },
  { key: "lucidia", title: "Lucidia", blurb: "Reasoning studio & co-agents.", href: "/portal/lucidia", status: "stub" },
  { key: "roadcode", title: "Roadcode", blurb: "Code, review, and ship fast.", href: "/portal/roadcode/index.html", status: "live" },
  { key: "roadcoin", title: "Roadcoin", blurb: "Wallet, staking, token economy.", href: "/portal/roadcoin/index.html", status: "live" },
  { key: "roadchain", title: "Roadchain", blurb: "Pipelines, lineage, and trust.", href: "/portal/roadchain", status: "stub" },
  { key: "radius", title: "Radius", blurb: "Signals, telemetry, and ops.", href: "/portal/radius", status: "stub" }
];

export const metadata = { title: "Portal — BlackRoad Hub" };

export default function PortalIndex() {
  return (
    <section className="container-x py-12">
      <header className="mb-8">
        <h1 className="h1">Portal</h1>
        <p className="mt-2 text-zinc-400">Everything in one dark, precise surface.</p>
      </header>

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tiles.map((t) => (
          <li key={t.key} className="card relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{ background: "linear-gradient(135deg, #ff3ea5 0%, #7c3aed 50%, #fb923c 100%)" }}
            />
            <div className="relative">
              <h3 className="h2">{t.title}</h3>
              <p className="mt-2 text-zinc-400">{t.blurb}</p>

              <div className="mt-5 flex items-center gap-3">
                <Link href={t.href} className="btn-primary">
                  Open
                </Link>
                {t.status === "stub" && (
                  <span className="rounded-xl bg-ink-800/60 px-3 py-1 text-xs text-zinc-400">stub • coming online</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
