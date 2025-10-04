# Codex Build Helper

`codex_build.py` offers a single entry point for BlackRoad.io's sync and
deploy workflow.  Each subcommand is designed to be invoked by a chat
agent or operator.

## Usage

```bash
python3 codex/tools/codex_build.py push-latest
python3 codex/tools/codex_build.py refresh
python3 codex/tools/codex_build.py rebase main
python3 codex/tools/codex_build.py sync-connectors
python3 codex/tools/codex_entries_audit.py            # Inspect Codex entries
```

The script currently contains placeholders for connectors, Working Copy,
and Droplet interactions.  Integrate the real APIs or automation hooks as
needed for your environment.

_Last updated on 2025-09-11_
