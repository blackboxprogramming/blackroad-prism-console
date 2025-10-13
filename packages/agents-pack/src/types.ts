export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonSchema = boolean | { [key: string]: JsonValue };

export interface ToolExample {
  name?: string;
  input: JsonValue;
  output: JsonValue;
}

export interface ToolDefinition {
  name: string;
  description: string;
  summary?: string;
  input_schema: JsonSchema;
  output_schema?: JsonSchema;
  examples?: ToolExample[];
  metadata?: Record<string, JsonValue>;
}

export type ConversationRole = "system" | "user" | "assistant" | "tool";

export interface ConversationMessageBase {
  id?: string;
  timestamp?: string;
  metadata?: Record<string, JsonValue>;
}

export interface SystemMessage extends ConversationMessageBase {
  role: "system";
  content: string;
}

export interface UserMessage extends ConversationMessageBase {
  role: "user";
  content: string;
}

export interface AssistantMessage extends ConversationMessageBase {
  role: "assistant";
  content: string;
}

export interface ToolMessage extends ConversationMessageBase {
  role: "tool";
  tool_call_id: string;
  content: string;
}

export type ConversationMessage =
  | SystemMessage
  | UserMessage
  | AssistantMessage
  | ToolMessage;

export interface AgentDescriptor {
  name: string;
  version: string;
}

export interface AgentRequest {
  request_id: string;
  timestamp: string;
  agent: AgentDescriptor;
  conversation: ConversationMessage[];
  tools: ToolDefinition[];
  metadata?: Record<string, JsonValue>;
  expected_latency_ms?: number;
}

export interface ToolCall {
  id: string;
  tool: string;
  input: JsonValue;
  metadata?: Record<string, JsonValue>;
}

export interface AssistantResponseMessage extends ConversationMessageBase {
  role: "assistant";
  content?: string;
  tool_calls?: ToolCall[];
}

export interface ToolResponseMessage extends ConversationMessageBase {
  role: "tool";
  tool_call_id: string;
  content: string;
}

export type AgentResponseMessage = AssistantResponseMessage | ToolResponseMessage;

export interface AgentError {
  type: string;
  message: string;
  details?: Record<string, JsonValue>;
}

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface AgentMetrics {
  latency_ms?: number;
  token_usage?: TokenUsage;
  [key: string]: JsonValue | TokenUsage | number | undefined;
}

export type AgentResponseStatus =
  | "success"
  | "error"
  | "invalid_request"
  | "rate_limited";

export interface AgentResponse {
  response_id: string;
  request_id: string;
  timestamp: string;
  status: AgentResponseStatus;
  messages: AgentResponseMessage[];
  error?: AgentError;
  metrics?: AgentMetrics;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: string[];
}
