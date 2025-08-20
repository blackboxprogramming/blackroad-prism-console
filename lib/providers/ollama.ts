export type Role = "system" | "user" | "assistant" | "tool";
export interface Msg { role: Role; content: string; }

const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const model = process.env.OLLAMA_MODEL || "llama3:instruct";

export async function chatOllama(messages: Msg[]) {
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.6 } })
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json?.message?.content ?? "";
}
