export const metadata = {
  title: "About | BlackRoad Docs"
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 text-slate-200">
      <h1 className="text-3xl font-bold text-slate-50">About this portal</h1>
      <p>
        BlackRoad Docs & Runbooks keeps operational knowledge versioned with the codebase. Every runbook is validated by
        CI and rendered as an executable document that can trigger RoadGlitch workflows with full idempotency.
      </p>
      <p>
        Use the search bar to locate runbooks quickly, review preconditions and safety guards, and execute workflows with
        confidence. Runbook authors can iterate locally using the lint CLI before opening a pull request.
      </p>
    </div>
  );
}
