'use client';

import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tabs } from '../ui/tabs';
import { Card } from '../ui/card';
import { interpretCommand, CommandResult } from './commandInterpreter';

const agents = ['Lucidia', 'Silas', 'Cecilia', 'Alexa'];

interface Message {
  role: 'user' | 'agent';
  agent?: string;
  content: string;
}

export default function CreativePortal() {
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [responses, setResponses] = useState<Record<string, string[]>>({});
  const [files, setFiles] = useState<Record<string, string>>({});

  function handleCommand(cmd: CommandResult) {
    if (cmd.type === 'create_file') {
      setFiles((f) => ({ ...f, [cmd.filename]: cmd.content }));
    }
    // Other command types are placeholders for future integration.
  }

  function sendMessage() {
    if (!input.trim()) return;
    setChatLog((log) => [...log, { role: 'user', content: input }]);
    handleCommand(interpretCommand(input));
    setResponses((prev) => {
      const next = { ...prev };
      agents.forEach((agent) => {
        next[agent] = [...(next[agent] || []), `${agent} received: ${input}`];
        setChatLog((log) => [...log, { role: 'agent', agent, content: `${agent} received: ${input}` }]);
      });
      return next;
    });
    setInput('');
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <Card className="p-4 flex flex-col h-80">
        <div className="flex-1 overflow-y-auto space-y-2 text-sm">
          {chatLog.map((m, i) => (
            <div key={i}>
              <b>{m.role === 'user' ? 'You' : m.agent}</b>: {m.content}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="mt-2 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your idea..."
          />
          <Button type="submit">Send</Button>
        </form>
      </Card>

      <Card className="p-4">
        <Tabs
          tabs={agents.map((agent) => ({
            value: agent,
            label: agent,
            content: (
              <ul className="space-y-1 text-sm">
                {(responses[agent] || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ),
          }))}
        />
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold">Files</h2>
        {Object.keys(files).length === 0 ? (
          <p className="text-xs text-gray-400">No files yet.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {Object.entries(files).map(([name]) => (
              <li key={name}>
                <span className="font-medium">{name}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
