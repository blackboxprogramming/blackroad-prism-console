import Link from "next/link";
import { allDocPages } from "contentlayer/generated";

export const metadata = {
  title: "Docs | BlackRoad"
};

export default function DocsIndexPage() {
  const docs = [...allDocPages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-50">Docs</h1>
        <p className="text-slate-400">Guides, concepts, and runbook authoring practices.</p>
      </header>
      <div className="grid gap-4">
        {docs.map((doc) => (
          <article key={doc.slug} className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
            <h2 className="text-2xl font-semibold text-slate-100">
              <Link href={doc.url}>{doc.title}</Link>
            </h2>
            {doc.description ? <p className="mt-2 text-sm text-slate-400">{doc.description}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
