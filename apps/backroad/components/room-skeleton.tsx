export function RoomsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="h-36 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
        />
      ))}
    </div>
  );
}

export function RoomDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
          />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40" />
    </div>
  );
}
