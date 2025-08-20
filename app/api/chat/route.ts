import { NextRequest, NextResponse } from "next/server";
import { chatOllama, type Msg } from "@/lib/providers/ollama";
import { codexInfinityPrompt } from "@/lib/prompts/codex-infinity";
import { searchFiles, readFile } from "@/lib/tools/files";

type Mode = "machine" | "chit-chat";
interface In {
  messages: { role: "user" | "assistant"; content: string }[];
  mode?: Mode;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages, mode: modeIn }: In = await req.json();
    let mode: Mode = (modeIn || (process.env.DEFAULT_MODE as Mode) || "machine");
    const last = messages?.at(-1)?.content ?? "";
    if (/chit\s*chat\s*cadillac/i.test(last)) mode = "chit-chat";

    const system: Msg = { role: "system", content: codexInfinityPrompt(mode) };
    const convo: Msg[] = [system, ...messages];

    // Pass 1
    const first = await chatOllama(convo);
    const parsed1 = tryJson(first);

    if (parsed1?.type === "tool") {
      const { name = "", args = {} } = parsed1;
      let toolResult: unknown;

      if (name === "files.search") {
        const q = String(args.query || "");
        toolResult = { ok: true, hits: searchFiles(q) };
      } else if (name === "files.read") {
        const p = String(args.path || "");
        const text = readFile(p);
        toolResult = text != null ? { ok: true, path: p, text } : { ok: false, error: "file not found" };
      } else {
        toolResult = { ok: false, error: `unknown tool: ${name}` };
      }

      const followup: Msg[] = [
        system,
        ...messages,
        { role: "tool", content: JSON.stringify({ name, result: toolResult }) },
        { role: "user", content: "Return the final user message JSON now." }
      ];

      const second = await chatOllama(followup);
      const parsed2 = tryJson(second);
      if (parsed2?.type === "message") return NextResponse.json(parsed2);
      return NextResponse.json({ type: "message", mode, content: second });
    }

    if (parsed1?.type === "message") return NextResponse.json(parsed1);
    return NextResponse.json({ type: "message", mode, content: first });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

function tryJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

