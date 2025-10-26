import { notFound } from "next/navigation";
import { RunbookPage } from "@/components/RunbookPage";
import { getRunbookById, getRunbooks } from "@/lib/runbook-data";

interface Params {
  params: {
    id: string;
  };
}

export function generateStaticParams() {
  return getRunbooks().map((runbook) => ({ id: runbook.id }));
}

export function generateMetadata({ params }: Params) {
  const runbook = getRunbookById(params.id);
  if (!runbook) return {};
  return {
    title: `${runbook.title} | Runbooks`
  };
}

export default function RunbookRoute({ params }: Params) {
  const runbook = getRunbookById(params.id);
  if (!runbook) {
    notFound();
  }
  return <RunbookPage runbook={runbook} />;
}
