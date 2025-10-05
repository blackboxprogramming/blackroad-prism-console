# Codex Infinity Prompt Pack

A lightweight prompt renderer for shipping consistent, parameterized briefs to Infinity lab nodes (Jetson agent, Pi-Holo, Pi-Ops, Pi Zero sim, and Arduino UNO bridge).

## What's inside

- `render.py` — tiny CLI that turns Markdown templates into filled prompts.
- `example.sh` — renders two ready-to-paste prompts into `out/`.
- `templates/` — reusable Markdown prompt blueprints with `{{variables}}`.

## Quick start

```bash
cd codex_infinity_prompts
./example.sh
```

The script drops sample prompts into `out/GENERAL_PROMPT.md` and `out/PI_OPS_PROMPT.md`.

## Custom rendering

Render any template by name and override the placeholders inline:

```bash
python3 render.py pi_ops \
  --project ops \
  --node pi_ops \
  --lang python \
  --goal "Curses dashboard for MQTT heartbeats" \
  --io "{input: mqtt, output: tty ui}" \
  --constraints "- 1600x600 UI\\n- <100MB RAM\\n- SQLite ring buffer" \
  --out out/PI_OPS_PROMPT.md
```

- Every `--key value` pair maps to a `{{key}}` placeholder in the template.
- Strings like `\n` are converted into real newlines so you can pass multi-line bullets.
- Use `--strict` to abort if any placeholder goes unresolved.
- `--show-vars` echoes the placeholders for a template before rendering.

## Listing templates

```bash
python3 render.py --list
```

To inspect the placeholders without rendering:

```bash
python3 render.py jetson_agent --show-vars --strict --out /tmp/dry-run
```

## Suggested workflow

1. Use the CSV preview already in this repo as a source for constraints or context.
2. Render prompts into `out/` and commit them with your task branch.
3. Drop the Markdown prompt into your coding model to bootstrap agent plans.

Feel free to fork the templates or wire the CLI into your own orchestration scripts.
