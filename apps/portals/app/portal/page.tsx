'use client';

import { useEffect, useState } from 'react';
import { Topbar } from '../../components/ui/topbar';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { parseAgentOutput } from '../../lib/interpreter';
import { runAbility } from '../../lib/runAbility';
import { useSessionManager } from '../hooks/useSessionManager';

export default function PortalPage() {
  const [input, setInput] = useState('');
  const { createSession, addMessage, addFile, getActiveSession } = useSessionManager();

  useEffect(() => {
    createSession();
  }, []);

  const handleAgentReply = async (raw: string) => {
    const { ability, content } = parseAgentOutput(raw);
    const active = getActiveSession();
    if (!active) return;

    const result = await runAbility({ ability, content });

    if (result.file) {
      addFile(active.id, result.file);
      addMessage(active.id, {
        role: 'agent',
        content: `Generated file: ${result.file.name}`,
        timestamp: Date.now(),
      });
    }

    if (result.output) {
      addMessage(active.id, {
        role: 'agent',
        content: result.output,
        timestamp: Date.now(),
      });
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const active = getActiveSession() ?? createSession();

    addMessage(active.id, {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    });

    const lower = input.toLowerCase();
    let abilityTag: string;
    if (lower.includes('code')) {
      abilityTag = `<ability:codestream.generateFile>${input}</ability>`;
    } else if (lower.includes('image')) {
      abilityTag = `<ability:visioncraft.generateImage>${input}</ability>`;
    } else {
      abilityTag = `<ability:thoughtmirror.reflect>${input}</ability>`;
    }

    handleAgentReply(abilityTag);
    setInput('');
  };

  const active = getActiveSession();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Lucidia" />
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        {active?.messages.map((msg, i) => (
          <Card
            key={i}
            className={`p-3 text-sm border-l-4 ${
              msg.role === 'agent' ? 'border-purple-500' : 'border-gray-600'
            }`}
          >
            <span className="font-semibold">{msg.role === 'user' ? 'You' : 'Lucidia'}:</span> {msg.content}
          </Card>
        ))}
      </main>
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-gray-800 p-4"
      >
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a command..."
          className="flex-1"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}

