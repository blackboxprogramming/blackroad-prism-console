from adapters.anthropic_adapter import AnthropicAdapter, ToolSpec
from adapters.anthropic_tools import TOOLS

system = open("/opt/blackroad/codex/prompts/claude_codex_system.prompt", "r").read()

adapter = AnthropicAdapter()
tools = [ToolSpec(**t) for t in TOOLS]

messages = [{"role":"user","content":"What’s the time in Tokyo? Then run Guardian."}]
out = adapter.chat(messages, tools=tools, system=system, json_mode=False)
print(out["text"])

