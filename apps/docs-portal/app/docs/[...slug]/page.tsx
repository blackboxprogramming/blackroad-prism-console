import { notFound } from "next/navigation";
import { allDocPages } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer/hooks";
import Callout from "@/components/Callout";

interface Params {
  params: {
    slug: string[];
  };
}

const components = {
  Callout
};

export function generateStaticParams() {
  return allDocPages.map((doc) => ({ slug: doc.slug.split("/") }));
}

export function generateMetadata({ params }: Params) {
  const slug = params.slug.join("/");
  const doc = allDocPages.find((item) => item.slug === slug);
  if (!doc) return {};
  return {
    title: `${doc.title} | Docs`
  };
}

export default function DocPage({ params }: Params) {
  const slug = params.slug.join("/");
  const doc = allDocPages.find((item) => item.slug === slug);
  if (!doc) {
    notFound();
  }
  const MDXContent = useMDXComponent(doc.body.code);
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 text-slate-200">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-50">{doc.title}</h1>
        {doc.description ? <p className="text-slate-400">{doc.description}</p> : null}
      </header>
      <MDXContent components={components} />
    </article>
  );
}
