export function ObjectivesList({ objectives }: { objectives: string[] }) {
  return (
    <section aria-labelledby="objectives-heading" className="mt-6 rounded border border-slate-200 bg-slate-50 p-4">
      <h2 id="objectives-heading" className="text-lg font-semibold text-slate-800">
        Learning objectives
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
        {objectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
    </section>
  );
}
