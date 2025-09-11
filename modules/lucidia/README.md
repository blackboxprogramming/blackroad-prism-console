# Lucidia

A lightweight multi-agent chat portal that routes natural-language requests to
available agents. Initial support is provided through an adapter for the existing
`AutoNovelAgent` found under `agents/`.

## Usage

```python
from modules.lucidia import LucidiaPortal, AutoNovelAdapter

portal = LucidiaPortal([AutoNovelAdapter()])
responses = portal.chat("tell me a story about exploration")
print(responses["AutoNovelAgent"])  # -> short story
```

_Last updated on 2025-09-11_
