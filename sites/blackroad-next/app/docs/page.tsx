import { DocsList } from "@/components/docs-list";
import { readIndex } from "@/lib/docs";

export const metadata = { title: "Docs — BlackRoad Hub" };

export default function DocsHome() {
  const { docs } = readIndex();

  return (
    <section className="container-x py-12">
      <h1 className="h1 mb-6">Docs</h1>
      <DocsList docs={docs} />
    </section>
  );
}
