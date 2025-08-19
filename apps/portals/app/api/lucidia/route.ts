// FILE: app/api/lucidia/route.ts
import { streamText, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const modelId = process.env.LUCIDIA_MODEL ?? 'gpt-4o-mini';
  const result = streamText({
    model: openai(modelId),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    onError(error) {
      return error instanceof Error ? error.message : String(error);
    },
  });
}
