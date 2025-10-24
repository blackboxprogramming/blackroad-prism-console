import React, { useMemo } from 'react';

function parseCsv(text = '') {
  return text
    .trim()
    .split(/\r?\n/)
    .map((row) => row.split(',').map((cell) => cell.trim()));
}

export default function TableCard({ artifact }) {
  const rows = useMemo(() => {
    if (Array.isArray(artifact?.rows)) {
      return artifact.rows;
    }
    if (typeof artifact?.csv === 'string') {
      return parseCsv(artifact.csv);
    }
    return [];
  }, [artifact]);

  if (!rows.length) {
    return <div className="text-sm text-slate-500">No table data available.</div>;
  }

  const [header, ...body] = rows;

  return (
    <div className="max-h-[520px] overflow-auto rounded border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {header.map((cell, index) => (
              <th key={index} scope="col" className="px-4 py-2 text-left font-semibold text-slate-700">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-slate-600">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
