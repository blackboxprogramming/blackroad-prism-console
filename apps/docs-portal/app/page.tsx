import Link from "next/link";
import { allDocPages } from "contentlayer/generated";
import { getRunbooks } from "@/lib/runbook-data";

export default function HomePage() {
  const docs = [...allDocPages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const runbooks = getRunbooks();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12">
      <section aria-labelledby="docs">
        <h1 id="docs" className="text-3xl font-bold text-slate-50">
          Documentation
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={doc.url}
              className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 transition hover:border-sky-500"
            >
              <h2 className="text-xl font-semibold text-slate-100">{doc.title}</h2>
              {doc.description ? <p className="mt-2 text-sm text-slate-400">{doc.description}</p> : null}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="runbooks">
        <div className="flex items-center justify-between">
          <h2 id="runbooks" className="text-3xl font-bold text-slate-50">
            Runbooks
          </h2>
          <Link href="/runbooks" className="text-sm text-sky-400">
            View all
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {runbooks.map((runbook) => (
            <Link
              key={runbook.id}
              href={`/runbooks/${runbook.id}`}
              className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 transition hover:border-sky-500"
            >
              <h3 className="text-xl font-semibold text-slate-100">{runbook.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{runbook.summary}</p>
              <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                Severity: {runbook.severity}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
