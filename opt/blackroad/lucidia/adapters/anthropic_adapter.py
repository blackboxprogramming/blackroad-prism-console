from __future__ import annotations

import json
import os
import time
import typing as t
from dataclasses import dataclass, field

from anthropic import Anthropic, APIError  # SDK docs & install: https://docs.anthropic.com/  # noqa

ToolFn = t.Callable[[dict], t.Any]

@dataclass
class ToolSpec:
    name: str
    description: str
    schema: dict
    fn: ToolFn

@dataclass
class AnthropicAdapter:
    model: str = field(default_factory=lambda: os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620"))
    api_key: str = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    temperature: float = 0.2
    max_tokens: int = 1200
    client: Anthropic = field(init=False)

    def __post_init__(self):
        if not self.api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        self.client = Anthropic(api_key=self.api_key)

    def _tool_defs(self, tools: list[ToolSpec]) -> list[dict]:
        return [
            {
                "name": t_.name,
                "description": t_.description,
                "input_schema": t_.schema,
            }
            for t_ in tools
        ]

    def chat(
        self,
        messages: list[dict],
        *,
        tools: list[ToolSpec] | None = None,
        system: str | None = None,
        json_mode: bool = False,
        stream: bool = False,
    ) -> dict:
        """
        messages: [{"role":"user"|"assistant", "content": str|list}]
        Returns: {"text": str, "raw": response, "trace": list[dict]}
        """
        trace: list[dict] = []
        tool_lookup = {t_.name: t_ for t_ in (tools or [])}
        tool_defs = self._tool_defs(tools or [])

        while True:
            try:
                resp = self.client.messages.create(
                    model=self.model,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    system=system,  # system is a top-level field (no system role)  # see docs
                    tools=tool_defs if tools else None,
                    response_format={"type": "json_object"} if json_mode else None,
                    messages=messages,
                )
            except APIError:
                raise

            trace.append({"t": time.time(), "direction": "assistant", "content": [c.to_dict() for c in resp.content]})

            # Collect tool calls (if any)
            tool_calls = []
            for block in resp.content:
                if getattr(block, "type", None) == "tool_use":
                    tool_calls.append(block)

            if tool_calls:
                # Execute all tool calls in parallel-ish, then append a user/tool_result message.
                results = []
                for call in tool_calls:
                    spec = tool_lookup.get(call.name)
                    if not spec:
                        out = {"error": f"Unknown tool '{call.name}'"}
                    else:
                        try:
                            out_raw = spec.fn(call.input or {})
                            out = out_raw if isinstance(out_raw, (str, int, float, dict, list, bool)) else str(out_raw)
                        except Exception as ex:
                            out = {"error": repr(ex)}
                    # tool_result blocks must be first in the next user message
                    # and must reference the exact tool_use id. (Strict API rule.)
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": call.id,
                        "content": out if isinstance(out, str) else json.dumps(out),
                    })

                # Append the assistant tool use content (for full conversation state), then tool results
                messages.append({"role": "assistant", "content": [c.to_dict() for c in resp.content]})
                messages.append({"role": "user", "content": results})
                trace.append({"t": time.time(), "direction": "user", "content": results})
                continue  # Loop again so Claude can synthesize using the tool results

            # No tool use → return final text
            final_text = "".join(getattr(b, "text", "") for b in resp.content if getattr(b, "type", "") == "text")
            return {"text": final_text, "raw": resp.to_dict(), "trace": trace}
