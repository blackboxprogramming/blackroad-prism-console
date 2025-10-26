import clsx from "clsx";

export function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2" aria-label="Runbook tags">
      {tags.map((tag) => (
        <span key={tag} className="badge">
          #{tag}
        </span>
      ))}
    </div>
  );
}

export function SloBadge() {
  return (
    <span className={clsx("badge", "slo-badge")}>SLO</span>
  );
}
