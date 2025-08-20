# Codex Project Contract (Short)
- Style: prefer pure functions, explicit errors, no hidden I/O.
- Testing: table-driven tests, branch coverage on error paths, no network/disk in unit tests.
- Security: validate inputs; never log secrets; parameterize queries; constant-time compare for auth tokens.
- Docs: each public API has examples; keep examples runnable.
- Acceptance:
  - All new code ships with tests.
  - Lint clean; type checks pass.
  - Performance: no O(N^2) on hot paths; note complexity in docstrings.

# Output Requirements
- Respond with unified diffs or complete files ready to commit.
- Keep patches minimal; do not change public APIs unless asked.
- Include rationale at the bottom under `Rationale:` if needed.
