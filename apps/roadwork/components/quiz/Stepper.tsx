export function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <nav aria-label="Progress" className="flex items-center gap-2" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={`h-2 flex-1 rounded ${index < current ? 'bg-brand-500' : 'bg-slate-200'}`}
        />
      ))}
      <span className="text-sm text-slate-600">
        Step {current} of {total}
      </span>
    </nav>
  );
}
