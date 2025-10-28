// FILE: app/api/chat/route.ts
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

export const maxDuration = 30;

function pickModel() {
  const provider = process.env.LLM_PROVIDER ?? 'openai';
  const modelId = process.env.LLM_MODEL ?? 'gpt-4o';

  if (provider === 'openai-compatible') {
    const compat = createOpenAICompatible({
      name: 'custom',
      apiKey: process.env.LLM_API_KEY,
      baseURL: process.env.LLM_BASE_URL!,
      includeUsage: true,
    });
    return compat(modelId);
  }

  return openai(modelId);
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: pickModel(),
    messages: convertToModelMessages(messages),

    tools: {
      getServerStatus: {
        description: 'Fetch BlackRoad backend health summary',
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const res = await fetch(process.env.STATUS_URL ?? 'http://127.0.0.1:9000/health', { cache: 'no-store' });
            if (!res.ok) return 'unreachable';
            return await res.json().catch(() => 'ok');
          } catch {
            return 'unreachable';
          }
        },
      },
      searchDocs: {
        description: 'Search Lucidia docs by keyword',
        inputSchema: z.object({ query: z.string().min(1) }),
        execute: async ({ query }: { query: string }) => {
          try {
            const url = `${process.env.SEARCH_URL ?? 'http://127.0.0.1:9000'}/api/search?q=${encodeURIComponent(query)}`;
            const res = await fetch(url, { cache: 'no-store' });
            return res.ok ? await res.json() : [];
          } catch {
            return [];
          }
        },
      },
    },

    // guard against runaway multi-step tool loops
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    onError(error) {
      return error instanceof Error ? error.message : String(error);
    },
  });
}
