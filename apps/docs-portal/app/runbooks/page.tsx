import Link from "next/link";
import { getRunbooks } from "@/lib/runbook-data";
import { Tags } from "@/components/Tags";

export const metadata = {
  title: "Runbooks | BlackRoad Docs"
};

export default function RunbooksIndexPage() {
  const runbooks = getRunbooks();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-50">Runbooks</h1>
        <p className="text-slate-400">Operational procedures validated and executable via RoadGlitch.</p>
      </header>
      <div className="grid gap-4">
        {runbooks.map((runbook) => (
          <article key={runbook.id} className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-100">
                  <Link href={`/runbooks/${runbook.id}`}>{runbook.title}</Link>
                </h2>
                <p className="text-sm text-slate-400">{runbook.summary}</p>
              </div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Severity: {runbook.severity}
              </div>
            </header>
            <div className="mt-4 text-sm text-slate-400">Owners: {runbook.owners.join(", ")}</div>
            <div className="mt-3">
              <Tags tags={runbook.tags} />
            </div>
            <div className="mt-4">
              <Link href={`/runbooks/${runbook.id}`} className="text-sm text-sky-400">
                View details
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
