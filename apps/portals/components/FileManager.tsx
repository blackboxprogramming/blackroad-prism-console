'use client';

import { useState } from 'react';

export interface FileData {
  name: string;
  content: string;
}

interface Props {
  files: FileData[];
  onChange: (files: FileData[]) => void;
}

export function FileManager({ files, onChange }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function createFile() {
    const name = prompt('File name?');
    if (!name) return;
    onChange([...files, { name, content: '' }]);
  }

  function renameFile(i: number) {
    const name = prompt('New name?', files[i].name);
    if (!name) return;
    const updated = [...files];
    updated[i].name = name;
    onChange(updated);
  }

  function deleteFile(i: number) {
    if (!confirm('Delete file?')) return;
    const updated = [...files];
    updated.splice(i, 1);
    onChange(updated);
    if (openIndex === i) setOpenIndex(null);
  }

  function updateContent(i: number, content: string) {
    const updated = [...files];
    updated[i].content = content;
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Files</h2>
        <button onClick={createFile} className="border rounded px-2 py-1 text-xs">
          New File
        </button>
      </div>
      <ul className="space-y-1">
        {files.map((f, i) => (
          <li key={i} className="border rounded p-2">
            <div className="flex justify-between">
              <span
                className="cursor-pointer"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                {f.name}
              </span>
              <div className="space-x-1 text-xs">
                <button onClick={() => renameFile(i)}>Rename</button>
                <button onClick={() => deleteFile(i)}>Delete</button>
              </div>
            </div>
            {openIndex === i && (
              <textarea
                className="mt-2 h-32 w-full rounded border p-2 text-xs"
                value={f.content}
                onChange={(e) => updateContent(i, e.target.value)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileManager;

