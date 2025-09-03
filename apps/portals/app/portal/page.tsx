'use client';

import { useState } from 'react';
import { Topbar } from '../../components/ui/topbar';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

interface Message {
  sender: string;
  text: string;
}

const AGENTS = ['Lucidia', 'Silas', 'Cecilia', 'Alexa'] as const;

type Agent = typeof AGENTS[number];

const AGENT_COLORS: Record<Agent, string> = {
  Lucidia: 'border-purple-500',
  Silas: 'border-blue-500',
  Cecilia: 'border-green-500',
  Alexa: 'border-pink-500',
};

const RESPONSES = {
  default: {
    Lucidia: 'I\'m processing your request.',
    Silas: 'Awaiting the next command.',
    Cecilia: 'Happy to help when needed.',
    Alexa: 'Standing by.',
  },
  create: {
    Lucidia: 'New file created successfully.',
    Silas: 'File saved to workspace.',
    Cecilia: 'Documentation updated with new file.',
    Alexa: 'File is ready for use.',
  },
  run: {
    Lucidia: 'Executing code now.',
    Silas: 'Code run completed.',
    Cecilia: 'No errors detected.',
    Alexa: 'Output captured.',
  },
  image: {
    Lucidia: 'Generating image...',
    Silas: 'Pixels arranged.',
    Cecilia: 'Preview ready.',
    Alexa: 'Image available for download.',
  },
} satisfies Record<string, Record<Agent, string>>;

export default function PortalPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'You', text: input };
    const lower = input.toLowerCase();
    let key: keyof typeof RESPONSES = 'default';
    if (lower.includes('create') && lower.includes('file')) key = 'create';
    else if (lower.includes('run') && lower.includes('code')) key = 'run';
    else if (lower.includes('generate') && lower.includes('image')) key = 'image';

    const replies: Message[] = AGENTS.map(agent => ({
      sender: agent,
      text: RESPONSES[key][agent],
    }));

    setMessages(prev => [...prev, userMessage, ...replies]);
    setInput('');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Lucidia" />
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <Card
            key={i}
            className={`p-3 text-sm ${
              AGENTS.includes(msg.sender as Agent)
                ? 'border-l-4 ' + AGENT_COLORS[msg.sender as Agent]
                : 'border-l-4 border-gray-600'
            }`}
          >
            <span className="font-semibold">{msg.sender}:</span> {msg.text}
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

