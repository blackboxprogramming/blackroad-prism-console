export function ScoreCard({ score }: { score: number }) {
  return (
    <section
      aria-labelledby="score-heading"
      className="rounded border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 id="score-heading" className="text-lg font-semibold">
        Quiz summary
      </h2>
      <p className="mt-2 text-3xl font-bold text-brand-600">{score}%</p>
      <p className="text-sm text-slate-600">Score is calculated from correct answers.</p>
    </section>
  );
}
