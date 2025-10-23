import { NextRequest, NextResponse } from "next/server";
import { chatOllama, type Msg } from "@/lib/providers/ollama";
import { codexInfinityPrompt } from "@/lib/prompts/codex-infinity";
import { dispatchTool } from "@/lib/tools/wrappers";

type Mode = "machine" | "chit-chat";
interface In {
  messages: { role: "user" | "assistant"; content: string }[];
  mode?: Mode;
  prompt?: string;
  board?: string;
  task?: string;
  catalog?: boolean;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body: In = await req.json();
    let { messages, mode: modeIn, prompt, board, task, catalog } = body;
    if (!messages && typeof prompt === "string") {
      messages = [{ role: "user", content: prompt }];
    }
    let mode: Mode = (modeIn || (process.env.DEFAULT_MODE as Mode) || "machine");
    const last = messages?.at(-1)?.content ?? "";
    if (/chit\s*chat\s*lucidia/i.test(last)) mode = "chit-chat";

    const boardOpt = typeof board === "string" ? board.trim() : "";
    const taskOpt = typeof task === "string" ? task.trim() : "";
    const includeCatalog = Boolean(catalog);

    const system: Msg = {
      role: "system",
      content: codexInfinityPrompt(mode, {
        board: boardOpt || undefined,
        task: taskOpt || undefined,
        includeCatalog
      })
    };
    const convo: Msg[] = [system, ...messages];

    // Pass 1
    const first = await chatOllama(convo);
    const parsed1 = tryJson(first);

    if (parsed1?.type === "tool") {
      const { name = "", args = {} } = parsed1;
      const toolResult = await dispatchTool(name, args);

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

