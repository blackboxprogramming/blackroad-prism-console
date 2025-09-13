# Prism Console

Offline-first console utilities for the BlackRoad Prism stack.

## Quick Start (90 seconds)

1. `pip install -r requirements.txt`
2. `python -m cli.console preflight:check`
3. `python -m cli.console bot:list`
4. `make demo`
5. `python -m cli.console docs:build`
6. `make dist`

## Local Release Flow

```bash
python -m cli.console version:show
python -m cli.console preflight:check
make demo
python -m cli.console release:notes --version $(python -m cli.console version:show | tail -1)
make dist && ls -l dist/ && cat dist/checksums.txt
```

## Troubleshooting

- **Permissions**: ensure the `logs/` directory is writable.
- **Missing key**: if `EAR_ENABLED=1`, provide `config/ear_key.json`.
- **Read-only mode**: run commands with sufficient permissions to write to `dist/` and `logs/`.

## Support Matrix

| Python | Network |
|--------|---------|
| 3.11   | offline |

## License

MIT
