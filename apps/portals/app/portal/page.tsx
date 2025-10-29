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

"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type Message,
} from "ai";
import FileManager, { FileData } from "../../components/FileManager";
import { saveSession, getCurrentSession } from "../../lib/sessionEngine";

const agents = ["Lucidia", "Silas", "Cecilia", "Alexa"];

export default function PortalPage() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const [agent, setAgent] = useState("Lucidia");
  const [input, setInput] = useState("");
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [lastAssistant, setLastAssistant] = useState("");

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setInitialMessages(session.chat || []);
      setFiles(session.files || []);
      setAssets(session.assets || []);
    }
  }, []);

  const allMessages: Message[] = [...initialMessages, ...messages];

  useEffect(() => {
    const last = allMessages.filter((m) => m.role === "assistant").slice(-1)[0];
    if (last) {
      const part = last.parts.find((p) => p.type === "text") as
        | { type: "text"; text: string }
        | undefined;
      setLastAssistant(part?.text || "");
    }
  }, [allMessages]);

  function handleSave() {
    const name = prompt("Session name?");
    if (!name) return;
    saveSession(name, { chat: allMessages, files, assets });
  }

  function saveLastToFile() {
    if (!lastAssistant) return;
    const name = prompt("File name?", `note-${files.length + 1}.txt`);
    if (!name) return;
    setFiles([...files, { name, content: lastAssistant }]);
  }

  function generateImage() {
    const url = `https://picsum.photos/seed/${Date.now()}/300/200`;
    setAssets([...assets, url]);
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <div className="flex items-center gap-2">
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          >
            {agents.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="rounded border px-2 py-1 text-sm"
          >
            Save Session
          </button>
        </div>

        <div className="space-y-3">
          {allMessages.map((m) => (
            <div key={m.id} className="text-sm leading-relaxed">
              <b>{m.role}:</b>{" "}
              {m.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <span key={i}>{(part as { text: string }).text}</span>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ))}
        </div>

        {status === "error" && (
          <div className="text-red-600">{String(error)}</div>
        )}

        {lastAssistant && (
          <div className="flex gap-2 text-xs">
            <button
              onClick={saveLastToFile}
              className="rounded border px-2 py-1"
            >
              Save to File
            </button>
            <button
              onClick={generateImage}
              className="rounded border px-2 py-1"
            >
              Generate Image
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: `[${agent}] ${input}` });
              setInput("");
            }
          }}
          className="flex gap-2"
        >
          <input
            className="flex-1 rounded border px-3 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${agent}…`}
          />
          <button className="rounded border px-3 py-2">Send</button>
        </form>

        {assets.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-bold">Assets</h2>
            <div className="grid grid-cols-3 gap-2">
              {assets.map((a, i) => (
                <img key={i} src={a} alt="asset" className="w-full rounded" />
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        <FileManager files={files} onChange={setFiles} />
      </div>
    </main>
  );
}
import CreativePortal from '../../components/portal/CreativePortal';

export const metadata = {
  title: 'AI Creative Portal',
  description: 'Chat with BlackRoad agents and build projects without code.',
  alternates: { canonical: 'https://www.blackroad.io/portal' },
};

export default function PortalPage() {
  return <CreativePortal />;
}

