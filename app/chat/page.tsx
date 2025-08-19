"use client";

import * as React from "react";
import { useChat } from "ai/react";

export default function ChatPage() {
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    id: "default",
  });

  return (
    <div style={{maxWidth: 840, margin: "40px auto", padding: 16}}>
      <h1 style={{fontSize: 24, fontWeight: 700, marginBottom: 12}}>
        Lucidia Chat
      </h1>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          minHeight: 360,
          background: "#fff",
        }}
      >
        {messages.length === 0 && (
          <div style={{color: "#6b7280"}}>Ask me anything to begin…</div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{marginBottom: 12}}>
            <div style={{fontSize: 12, color: "#6b7280"}}>
              {m.role === "user" ? "You" : "Assistant"}
            </div>
            <div style={{whiteSpace: "pre-wrap"}}>{m.content}</div>
          </div>
        ))}
        {isLoading && (
          <div style={{fontSize: 12, color: "#6b7280"}}>Thinking…</div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{display: "flex", gap: 8, marginTop: 12}}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
          }}
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #111827",
            background: "#111827",
            color: "white",
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </form>

      <p style={{fontSize: 12, color: "#6b7280", marginTop: 8}}>
        Powered by Vercel AI SDK · Streaming enabled
      </p>
    </div>
  );
}
