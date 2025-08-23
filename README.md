# BlackRoad Prism Console

This repository contains assorted utilities for the BlackRoad project.

## Codex Pipeline Scaffold

The `scripts/blackroad_pipeline.py` script offers a chat-oriented control
surface that maps high level phrases to underlying actions. It currently
wraps common Git operations and prints placeholders for connector sync,
working copy refresh and droplet deployment.

### Example

```bash
python scripts/blackroad_pipeline.py "Push latest to BlackRoad.io"
```

The phrases recognised by the controller can be listed by invoking the
script with an unknown command.
