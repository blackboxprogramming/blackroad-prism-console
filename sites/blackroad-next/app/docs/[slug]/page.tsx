import { renderDoc } from "@/lib/docs";

export async function generateStaticParams() {
  try {
    const index = await import("../../../../public/docs.index.json");
    return index.default.docs.map((doc: { slug: string }) => ({ slug: doc.slug }));
  } catch (error) {
    return [];
  }
}

export default function DocPage({ params }: { params: { slug: string } }) {
  const doc = renderDoc(params.slug);
  if (!doc) {
    return <div className="container-x py-12">Not found.</div>;
  }

  return (
    <article className="container-x max-w-none py-12 prose prose-invert">
      <h1 className="h1 mb-6">{doc.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  );
}
