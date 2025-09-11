import React, { useState } from 'react';

interface PrismDiffHunk {
  lines: string[];
}
interface PrismDiff {
  path: string;
  hunks: PrismDiffHunk[];
}

interface Props {
  diffs: PrismDiff[];
  onApply: (diffs: PrismDiff[]) => void;
}

const Diffs: React.FC<Props> = ({ diffs, onApply }) => {
  const [selected, setSelected] = useState<Record<string, number[]>>({});
  const toggle = (path: string, idx: number) => {
    setSelected((prev) => {
      const set = new Set(prev[path] || []);
      if (set.has(idx)) set.delete(idx); else set.add(idx);
      return { ...prev, [path]: Array.from(set) };
    });
  };
  const handleApply = () => {
    const filtered = diffs.map((d) => ({
      ...d,
      hunks: d.hunks.filter((_: PrismDiffHunk, i: number) => selected[d.path]?.includes(i)),
    }));
    onApply(filtered);
  };
  return (
    <div>
      {diffs.map((d) => (
        <div key={d.path}>
          <div>{d.path}</div>
          {d.hunks.map((h: PrismDiffHunk, i: number) => (
            <label key={i}>
              <input
                type="checkbox"
                checked={selected[d.path]?.includes(i) ?? false}
                onChange={() => toggle(d.path, i)}
              />
              <pre>{h.lines.join('\n')}</pre>
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleApply}>Apply</button>
    </div>
  );
};

export default Diffs;
