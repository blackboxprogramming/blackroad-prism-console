# Prompt Learning Governance

The prompt learning deltas for Codex-aligned agents are stored in this directory.

## Governance Flow

1. **agent proposes change** → `POST /learning/propose` with diff block
2. **maintainer reviews** → `POST /learning/approve` adds digital signature
3. **system applies patch** → new `*.yaml` committed, evaluation harness runs
4. **metrics logged** → success/failure → XP updated
