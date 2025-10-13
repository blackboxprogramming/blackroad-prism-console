import React, { useState, useRef } from 'react';
import { PrismKernel } from '../kernel';

interface Props {
  kernel: PrismKernel;
  onChange: () => void;
}

const Terminal: React.FC<Props> = ({ kernel, onChange }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const print = (line: string) => setLines(l => [...l, line]);

  const run = async (cmd: string) => {
    const parts = cmd.split(' ');
    const base = parts[0];
    try {
      switch (base) {
        case 'agents':
          print(kernel.listAgents().join(' '));
          break;
        case 'spawn':
          await kernel.spawn(parts[1]);
          print(`spawned ${parts[1]}`);
          onChange();
          break;
        case 'send': {
          const agent = parts[1];
          const msg = cmd.match(/send\s+\w+\s+"([\s\S]*)"/)?.[1] ?? parts.slice(2).join(' ');
          kernel.send(agent, msg);
          print(`sent to ${agent}`);
          onChange();
          break;
        }
        case 'recv': {
          const agent = parts[1];
          const msg = kernel.recv(agent);
          print(msg ?? '');
          onChange();
          break;
        }
        case 'ls':
          print(kernel.ls(parts[1]).join(' '));
          break;
        case 'cat': {
          const content = kernel.cat(parts[1]);
          if (content) {
            // Split by newlines to display each line separately
            content.split('\n').forEach(line => print(line));
          }
          break;
        }
        case 'cat':
          print(kernel.cat(parts[1]) ?? '');
          break;
        default:
          print('unknown command');
      }
    } catch (e:any) {
      print(e.message);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    print(`> ${input}`);
    run(input);
    setInput('');
  };

  return (
    <div className="bg-black text-green-400 p-2 h-full flex flex-col" onClick={() => inputRef.current?.focus()}>
      <div className="flex-1 overflow-y-auto font-mono text-sm" id="output">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-1">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full bg-black text-green-400 outline-none"
          autoFocus
        />
      </form>
    </div>
  );
};

export default Terminal;
