import { xai } from "@ai-sdk/xai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Decide which provider & model to use from env:
 *   AI_PROVIDER = xai | openai | anthropic
 *   AI_MODEL    = model name (optional; defaults per provider)
 *
 * Required API keys (set only the one you use):
 *   GROK_API_KEY        (for xAI)
 *   OPENAI_API_KEY      (for OpenAI)
 *   ANTHROPIC_API_KEY   (for Anthropic)
 */
export function getModel() {
  const provider = (process.env.AI_PROVIDER || "xai").toLowerCase();
  const modelName =
    process.env.AI_MODEL ||
    (provider === "openai"
      ? "gpt-4o-mini"
      : provider === "anthropic"
      ? "claude-3-5-sonnet"
      : "grok-2-1212");

  if (provider === "openai") return openai(modelName);
  if (provider === "anthropic") return anthropic(modelName);
  return xai(modelName);
}
