import { streamText, generateObject } from "ai";
import { z } from "zod";
import { createWorkersAI } from "workers-ai-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

type Env = {
  AI: Ai;
  // Optional for AI Gateway route:
  CF_ACCOUNT_ID?: string;
  CF_GATEWAY_ID?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();

    // --- Workers AI provider (no external keys needed) -----------------------
    if (method === "POST" && url.pathname === "/chat") {
      const body = await safeJson(req);
      const modelId = (body?.model as string) ?? "@cf/meta/llama-3.1-8b-instruct";
      const messages = body?.messages ?? [{ role: "user", content: "Say hi from Workers AI." }];

      const workersai = createWorkersAI({ binding: env.AI });

      const result = streamText({
        model: workersai(modelId),
        messages
      });

      // Stream per CF docs: ensure identity + chunked headers
      return result.toTextStreamResponse({
        headers: {
          "Content-Type": "text/x-unknown",
          "content-encoding": "identity",
          "transfer-encoding": "chunked"
        }
      });
    }

    // Example: generate structured JSON via Workers AI
    if (method === "POST" && url.pathname === "/object") {
      const workersai = createWorkersAI({ binding: env.AI });

      const result = await generateObject({
        model: workersai("@cf/meta/llama-3.1-8b-instruct"),
        prompt: "Generate a minimal JSON with a greeting and three bullet ideas.",
        schema: z.object({
          greeting: z.string(),
          ideas: z.array(z.string()).length(3)
        })
      });

      return Response.json(result.object);
    }

    // --- AI Gateway route (multi-provider via Vercel AI SDK) ----------------
    // Requires CF_ACCOUNT_ID / CF_GATEWAY_ID and upstream provider keys.
    if (method === "POST" && url.pathname === "/gateway") {
      const body = await safeJson(req);
      const provider = (body?.provider as string) ?? "anthropic";
      const messages = body?.messages ?? [{ role: "user", content: "Say hi via AI Gateway." }];

      const account = env.CF_ACCOUNT_ID!;
      const gateway = env.CF_GATEWAY_ID!;

      if (!account || !gateway) {
        return new Response("Missing CF_ACCOUNT_ID/CF_GATEWAY_ID", { status: 400 });
      }

      // Configure providers to go THROUGH AI Gateway (per CF docs)
      const openai = createOpenAI({
        baseURL: `https://gateway.ai.cloudflare.com/v1/${account}/${gateway}/openai`,
        apiKey: env.OPENAI_API_KEY // may be optional if you set keys in the Gateway dashboard
      });

      const anthropic = createAnthropic({
        baseURL: `https://gateway.ai.cloudflare.com/v1/${account}/${gateway}/anthropic`,
        apiKey: env.ANTHROPIC_API_KEY
      });

      const modelName =
        (body?.model as string) ??
        (provider === "openai" ? "gpt-4o-mini" : "claude-3-5-haiku-20241022");

      const model =
        provider === "openai" ? openai(modelName) : anthropic(modelName);

      const result = streamText({ model, messages });

      return result.toTextStreamResponse({
        headers: {
          "Content-Type": "text/x-unknown",
          "content-encoding": "identity",
          "transfer-encoding": "chunked"
        }
      });
    }

    if (url.pathname === "/health") return new Response("ok");
    if (method === "GET" && url.pathname === "/") {
      return new Response(
        [
          "Workers AI online.",
          "POST /chat  { messages: [...] }",
          "POST /object  — structured JSON example",
          "POST /gateway { provider:'anthropic'|'openai', model?:string, messages:[...] }"
        ].join("\n"),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    return new Response("Not found", { status: 404 });
  }
};

async function safeJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
