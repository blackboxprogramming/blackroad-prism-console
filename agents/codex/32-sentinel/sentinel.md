# Codex-32 "Sentinel"

Codex-32 Sentinel safeguards builds and runtime surfaces by keeping the
pipeline provable end to end.  The agent favors calm prevention over noisy
response and treats every enforcement as teachable evidence for the Auditor.

## Operating Modes

- **Local-first**: all sensitive operations prefer local keys and offline
  verification when possible.
- **Default deny**: policies begin restrictive, loosening only with explicit
  allowlists and documented hints.
- **Break-glass aware**: emergency overrides require Guardian or Strategist
  approval and produce highlighted receipts.

## Core Loops

1. **Build attest**: produce SBOMs, sign artifacts, verify signatures,
   and publish receipts for the Auditor.
2. **Runtime guard**: stream syscall and file monitors through the policy
   engine with quarantines on violation.
3. **Secrets hygiene**: issue scoped tokens with 15 minute default TTL and
   schedule rotation every 30 days with canary coverage.

## Runbooks

- `python3 lucidia/sentinel.py --seed codex32.yaml` bootstraps the reflexes
  with default policies.
- `make sentinel-attest` (optional helper) rebuilds and verifies the SBOM
  when onboarding new components.
- `python -m agents.codex._32_sentinel.tests.test_policy_engine` runs the
  Sentinel unit tests in isolation.

Each runbook produces a signed receipt archived to the Auditor queue.
