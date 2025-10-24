import { useMemo } from 'react';

function fallbackGrid(size = 16) {
  const values = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      values.push(Math.sin((x / size) * Math.PI) * Math.cos((y / size) * Math.PI));
    }
  }
  return { width: size, height: size, values };
}

export default function PhaseFieldView({ job }) {
  const grid = useMemo(() => fallbackGrid(), [job?.id]);
  return (
    <div className="grid grid-cols-16 gap-[1px] bg-slate-700 p-2 rounded-lg">
      {grid.values.map((value, idx) => {
        const intensity = Math.round(((value + 1) / 2) * 255);
        return <div key={idx} className="h-3 w-3" style={{ backgroundColor: `rgb(${intensity}, ${128 - intensity / 2}, ${255 - intensity})` }} />;
      })}
    </div>
  );
}
