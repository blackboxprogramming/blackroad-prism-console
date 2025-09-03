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
