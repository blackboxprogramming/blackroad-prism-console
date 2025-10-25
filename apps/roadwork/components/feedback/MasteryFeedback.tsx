const FEEDBACK = [
  { threshold: 80, label: 'Right level', description: 'Maintain focus and continue to the next lesson.' },
  {
    threshold: 60,
    label: 'Keep building',
    description: 'You are closing gaps. Review hints and revisit practice questions.'
  },
  {
    threshold: 0,
    label: 'Consider review',
    description: 'Spend time on the lesson content and practice before retrying the quiz.'
  }
];

export function MasteryFeedback({ score }: { score: number }) {
  const feedback = FEEDBACK.find((item) => score >= item.threshold) ?? FEEDBACK.at(-1)!;
  return (
    <section
      aria-labelledby="mastery-heading"
      className="rounded border border-brand-200 bg-brand-50 p-4"
    >
      <h2 id="mastery-heading" className="text-lg font-semibold text-brand-700">
        {feedback.label}
      </h2>
      <p className="text-sm text-brand-800">{feedback.description}</p>
    </section>
  );
}
