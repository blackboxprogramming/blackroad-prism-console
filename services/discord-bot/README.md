# BlackRoad Codex Discord Bot

Local-first Discord bot wired for BlackRoad + Lucidia Codex.

## Quickstart

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# copy env and set your values
cp .env.example .env

# edit src/config.yaml (guild IDs, backend)
# ensure Lucidia Codex API or Ollama is running locally

python -m src.main
```

Discord App setup: enable Message Content Intent; grant Send Messages, Send Messages in Threads, Create Public Threads, Read Message History, Use Application Commands; invite the bot to your guild(s).

_Last updated on 2025-09-11_
