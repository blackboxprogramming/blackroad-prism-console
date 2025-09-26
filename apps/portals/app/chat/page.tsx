// FILE: app/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { saveSession, getCurrentSession } from '../../lib/sessionEngine';

export default function ChatPage() {
  const { messages, sendMessage, addToolResult, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'getClientEnv') {
        addToolResult({
          tool: 'getClientEnv',
          toolCallId: toolCall.toolCallId,
          output: { tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
        });
      }
    },
  });

  const [input, setInput] = useState('');
  const [initialMessages, setInitialMessages] = useState<any[]>([]);

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setInitialMessages(session.chat || []);
    }
  }, []);

  const allMessages = [...initialMessages, ...messages];

  function handleSave() {
    const name = prompt('Session name?');
    if (!name) return;
    saveSession(name, { chat: allMessages, files: [], assets: [] });
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="space-y-3">
        {allMessages.map((m: any) => (
          <div key={m.id} className="text-sm leading-relaxed">
            <b>{m.role}:</b>{' '}
            {m.parts.map((part, i) => {
              switch (part.type) {
                case 'text':
                  return <span key={i}>{part.text}</span>;
                case 'tool-getServerStatus':
                case 'tool-searchDocs':
                  return (
                    <pre key={i} className="bg-black/80 text-white rounded p-3 overflow-x-auto text-xs">
                      {JSON.stringify(part.output ?? part.input, null, 2)}
                    </pre>
                  );
                case 'step-start':
                  return <hr key={i} className="my-2 opacity-40" />;
                default:
                  return null;
              }
            })}
          </div>
        ))}
      </div>

      {status === 'error' && <div className="text-red-600">{String(error)}</div>}

      <div className="flex gap-2">
        <button onClick={handleSave} className="border rounded px-3 py-2">Save Session</button>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
          }
        }}
        className="flex gap-2"
      >
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Lucidia…"
        />
        <button className="border rounded px-3 py-2">Send</button>
      </form>
    </main>
  );
}
