export function ChallengeLevelChip({ difficulty }: { difficulty: number }) {
  const labels: Record<number, string> = {
    1: 'Foundations',
    2: 'Core',
    3: 'Challenge'
  };
  return (
    <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
      Challenge level: {labels[difficulty] ?? difficulty}
    </span>
  );
}
