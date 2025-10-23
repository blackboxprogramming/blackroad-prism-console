# Quantum Lab Service

Local-first FastAPI service exposing small quantum puzzle simulations. Only the
CHSH game is implemented; Magic Square and GHZ games are reserved for future
work.

The companion `lucidia-quantum` CLI now auto-detects TorchQuantum, Pennylane,
and Qiskit backends for circuit generation. Use `lucidia-quantum --list-backends`
to inspect availability on your machine and pass `--backend pennylane` when you
need Pennylane-authored QASM exports while keeping batch training on
TorchQuantum.

## Run

```bash
export QUANTUM_API_TOKEN=choose-a-secret
uvicorn services.quantum_lab.app:app --port 8003
```

Open `web/quantum.html` in a browser and provide the token to run local
simulations.

## Security

- No outbound network access is permitted; sockets are disabled on startup.
- All API routes require a valid session and `X-Quantum-Token` header.
- Session summaries are recorded to a local SQLite database with SHA3-256
  hashes for integrity.
- The optional `ollama_client` only talks to localhost.

_Last updated on 2025-09-12_
