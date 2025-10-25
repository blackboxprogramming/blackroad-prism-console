'use client';

type Props = {
  tags: string[];
  active: string | null;
  onSelect: (tag: string | null) => void;
};

export function TagPills({ tags, active, onSelect }: Props) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2" role="list">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`rounded-full border px-3 py-1 text-sm ${
          active === null
            ? 'border-brand-500 bg-brand-50 text-brand-700'
            : 'border-slate-200 bg-white text-slate-700'
        }`}
      >
        All tags
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelect(tag)}
          className={`rounded-full border px-3 py-1 text-sm ${
            active === tag
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
