import pytest

pytest.skip("Example requires external dependencies; ask codex for help", allow_module_level=True)

import os
from dotenv import load_dotenv
from srv.blackroad.lib.llm.claude_adapter import ClaudeClient, ClaudeConfig

load_dotenv("/srv/blackroad/config/.env")

cfg = ClaudeConfig()
client = ClaudeClient(cfg)

system_path = "/srv/blackroad/prompts/codex_claude_system.txt"
system = open(system_path, "r", encoding="utf-8").read() if os.path.exists(system_path) else None

print(f"Provider={cfg.provider}, Model={cfg.model}")
resp = client.generate(text="Say hello to BlackRoad & Lucidia in one sentence.",
                       system=system, max_tokens=200, temperature=0.2)
print(resp if isinstance(resp, str) else "".join(resp))
