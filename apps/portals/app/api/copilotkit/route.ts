import { NextRequest } from "next/server";
import OpenAI from "openai";
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

// Create an OpenAI-compatible client (works with OpenAI or any /v1-compatible server via baseURL)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

const runtime = new CopilotRuntime();
const serviceAdapter = new OpenAIAdapter({ client });

// Generate Next.js App Router handlers (POST/OPTIONS) for /api/copilotkit
const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
});

export const POST = (req: NextRequest) => handleRequest(req);
export const OPTIONS = (req: NextRequest) => handleRequest(req);
