from __future__ import annotations
import os, json, typing as t
from dataclasses import dataclass

Provider = t.Literal["anthropic", "bedrock"]

@dataclass
class ClaudeConfig:
    provider: Provider = t.cast(Provider, os.getenv("CLAUDE_PROVIDER", "anthropic"))
    model: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
    # Anthropic direct
    anthropic_api_key: t.Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    anthropic_base_url: t.Optional[str] = os.getenv("ANTHROPIC_BASE_URL")
    # Bedrock
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")

class ClaudeClient:
    def __init__(self, cfg: ClaudeConfig | None = None):
        self.cfg = cfg or ClaudeConfig()
        if self.cfg.provider == "anthropic":
            from anthropic import Anthropic, DefaultHttpxClient
            http_client = DefaultHttpxClient()  # customize if needed
            self.client = Anthropic(
                api_key=self.cfg.anthropic_api_key,
                base_url=self.cfg.anthropic_base_url,
                http_client=http_client,
            )
        elif self.cfg.provider == "bedrock":
            import boto3
            self.bedrock = boto3.client("bedrock-runtime", region_name=self.cfg.aws_region)
        else:
            raise ValueError(f"Unknown provider: {self.cfg.provider}")

    # Unified call
    def generate(
        self,
        *,
        messages: list[dict[str, t.Any]] | None = None,
        text: str | None = None,
        system: str | list[dict[str, str]] | None = None,
        model: str | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.4,
        stream: bool = False,
        tools: list[dict[str, t.Any]] | None = None,
        tool_choice: t.Literal["auto","any","tool","none"] | dict | None = None,
        thinking: dict | None = None,  # e.g., {"type":"enabled", "budget_tokens":4096}
    ):
        model = model or self.cfg.model

        if self.cfg.provider == "anthropic":
            from anthropic import APIError
            # Build messages if user passed plain text
            if messages is None:
                if not text:
                    raise ValueError("Either messages or text must be provided.")
                messages = [{"role":"user","content":text}]
            try:
                if stream:
                    # SDK-native streaming helpers (SSE)
                    with self.client.messages.stream(
                        model=model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        system=system,
                        tools=tools,
                        tool_choice=tool_choice,
                        thinking=thinking,
                    ) as s:
                        for delta in s.text_stream:
                            yield delta
                        final = s.get_final_message()
                        # Optionally yield a sentinel or store `final`
                else:
                    resp = self.client.messages.create(
                        model=model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        system=system,
                        tools=tools,
                        tool_choice=tool_choice,
                        thinking=thinking,
                    )
                    # Return concatenated text blocks
                    return "".join([c.text for c in resp.content if c.type == "text"])
            except APIError as e:
                raise RuntimeError(f"Anthropic error: {e}") from e

        else:  # Bedrock
            # Map Anthropic-style messages to Bedrock Converse shape
            def _to_converse_content(msg: dict) -> dict:
                # Only text support here; extend for images/docs as needed
                content = msg.get("content", "")
                if isinstance(content, str):
                    parts = [{"text": content}]
                elif isinstance(content, list):
                    # If content blocks are dicts with {"type":"text","text":...}
                    parts = []
                    for b in content:
                        if isinstance(b, str):
                            parts.append({"text": b})
                        elif isinstance(b, dict) and b.get("type") == "text":
                            parts.append({"text": b.get("text", "")})
                else:
                    parts = [{"text": str(content)}]
                return {"role": msg["role"], "content": parts}

            if messages is None:
                if not text:
                    raise ValueError("Either messages or text must be provided.")
                messages = [{"role":"user","content":text}]

            br_messages = [_to_converse_content(m) for m in messages]
            system_prompts = None
            if system:
                if isinstance(system, str):
                    system_prompts = [{"text": system}]
                elif isinstance(system, list):
                    system_prompts = system

            inference_cfg = {"maxTokens": max_tokens, "temperature": temperature}

            if stream:
                # Streaming via ConverseStream
                resp = self.bedrock.converse_stream(
                    modelId=model,
                    system=system_prompts,
                    messages=br_messages,
                    inferenceConfig=inference_cfg,
                )
                for event in resp.get("stream", []):
                    # Text deltas arrive as contentBlockDelta
                    if "contentBlockDelta" in event:
                        delta = event["contentBlockDelta"]["delta"]
                        if "text" in delta:
                            yield delta["text"]
                return
            else:
                out = self.bedrock.converse(
                    modelId=model,
                    system=system_prompts,
                    messages=br_messages,
                    inferenceConfig=inference_cfg,
                )
                # Extract final text
                blocks = out.get("output", {}).get("message", {}).get("content", []) or []
                return "".join([b.get("text","") for b in blocks if "text" in b])
