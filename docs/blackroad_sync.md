# BlackRoad.io Sync Scaffold

This repository includes a helper script, `codex/tools/blackroad_sync.py`,
that sketches an end-to-end pipeline for pushing code through Codex,
GitHub, and eventually to the live BlackRoad.io deployment.

The script currently provides a minimal chat-first control surface:

```bash
python codex/tools/blackroad_sync.py push   # commit and push local changes
python codex/tools/blackroad_sync.py sync   # placeholder for connector sync
python codex/tools/blackroad_sync.py deploy # placeholder for droplet deploy
python codex/tools/blackroad_sync.py all    # run all steps sequentially
```

Connector integration, Working Copy automation, and droplet deployment
are not yet implemented and are marked as TODOs inside the script.
