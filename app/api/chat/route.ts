import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getModel } from "@/lib/ai/models";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages = [], temperature = 0.7 } = await req.json();
  const result = await streamText({
    model: getModel(),
    messages,
    temperature,
  });
  return result.toDataStreamResponse();
}
