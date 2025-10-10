import { describe, expect, it } from "vitest";

import {
  assertValid,
  validateAgentRequest,
  validateAgentResponse,
} from "../src/harness";

const baseTool = {
  name: "web_search",
  description: "Searches the public web",
  input_schema: {
    type: "object",
    required: ["query"],
    properties: {
      query: { type: "string" },
    },
  },
};

describe("agent request/response roundtrip", () => {
  it("validates a request and response pair", () => {
    const request = {
      request_id: "req-1234567890",
      timestamp: "2024-05-21T10:00:00Z",
      agent: {
        name: "console-agent",
        version: "1.0.0",
      },
      conversation: [
        {
          role: "system",
          content: "You are a helpful console agent.",
        },
        {
          role: "user",
          content: "Find me the latest Prism Console updates.",
        },
      ],
      tools: [baseTool],
    };

    const validatedRequest = assertValid(validateAgentRequest, request);
    expect(validatedRequest.request_id).toBe(request.request_id);

    const response = {
      response_id: "res-abcdef12345",
      request_id: request.request_id,
      timestamp: "2024-05-21T10:00:02Z",
      status: "success" as const,
      messages: [
        {
          role: "assistant" as const,
          content: "Here are the latest Prism Console updates...",
        },
      ],
      metrics: {
        latency_ms: 2100,
        token_usage: {
          prompt_tokens: 132,
          completion_tokens: 58,
          total_tokens: 190,
        },
      },
    };

    const validatedResponse = assertValid(validateAgentResponse, response);
    expect(validatedResponse.status).toBe("success");
  });

  it("rejects responses that call tools without tool_call_id", () => {
    const invalidResponse = {
      response_id: "res-tool-missing",
      request_id: "req-abcdef",
      timestamp: "2024-05-21T10:05:00Z",
      status: "success",
      messages: [
        {
          role: "tool",
          content: "handled",
        },
      ],
    };

    const result = validateAgentResponse(invalidResponse);
    expect(result.valid).toBe(false);
    expect(result.errors?.some((msg) => msg.includes("tool_call_id"))).toBe(true);
  });
});
