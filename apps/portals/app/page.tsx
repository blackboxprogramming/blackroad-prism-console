import Link from "next/link";
import { Card } from "../components/ui/card";
import { Logo } from "../components/ui/logo";

const portals = [
  { name: "Portal", href: "/portal" },
  { name: "RoadWork", href: "/roadwork" },
  { name: "RoadView", href: "/roadview" },
  { name: "RoadGlitch", href: "/roadglitch" },
  { name: "BackRoad", href: "/backroad" },
  { name: "Login", href: "/login" },
  { name: "Co-Code", href: "/cocode" },
  { name: "RoadCoin", href: "/roadcoin" },
  { name: "RoadChain", href: "/roadchain" },
  { name: "Roadie", href: "/roadie" },
  { name: "Lucidia", href: "/portal" },
  { name: "Codex", href: "/codex" },
  { name: "Prism Sources", href: "/prism/sources" },
  { name: "Ops Incidents", href: "/ops/incidents" },
  { name: "Risk Heatmap", href: "/scorecard/risk" },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Logo className="mb-8 h-16 w-16" />
      <div className="grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
        {portals.map((p) => (
          <Link key={p.href} href={p.href}>
            <Card className="flex items-center justify-center p-6 text-center transition hover:bg-gray-800">
              {p.name}
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
