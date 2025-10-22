# Lint and Security Findings — 2025-10-17

## Summary
- **Status**: Automated lint and security checks fail due to configuration and dependency issues across JavaScript, Go, and Python toolchains.
- **Impact**: Critical developer workflows (linting, vetting, security scanning) are blocked, preventing CI compliance and masking potential vulnerabilities.

## Detailed Findings

### JavaScript / TypeScript (High Severity)
- `npm install` fails because `package.json` is not valid JSON; duplicate script keys and malformed dependency blocks prevent dependency installation and ESLint execution.
- ESLint (`eslint.config.js`) cannot load `@eslint/js` due to the broken dependency graph.
- **Recommendation**: Normalize `package.json` (deduplicate scripts/dependencies, fix syntax) and re-establish a working lint task.

### Go (High Severity)
- `go vet ./...` fails: `harness/go.mod` declares duplicate `module` and `go` directives, and the `compliance` module requires Go 1.23 while `go.work` pins Go 1.21.
- **Recommendation**: Repair `harness/go.mod` structure and align `go.work` Go version/toolchain requirements with module needs.

### Python (High Severity)
- `ruff check .` aborts because `pyproject.toml` contains duplicate `[project]` and `[project.scripts]` tables with conflicting keys.
- Bandit is absent from the environment and the CI image; tooling installation should be codified before enforcement.
- **Recommendation**: Consolidate `pyproject.toml` metadata, remove duplicate sections, and add Bandit/ruff dependencies to the Python toolchain configuration.

## Follow-up Tasks
1. **Restore JavaScript lint pipeline** — Fix `package.json` structure, re-pin dependencies, and verify ESLint execution locally and in CI.
2. **Stabilize Go workspace** — Clean `harness/go.mod`, reconcile module requirements, and update `go.work` to a supported Go toolchain.
3. **Repair Python project metadata** — Normalize `pyproject.toml`, declare linter/security dependencies, and ensure `ruff`/`bandit` run cleanly.
4. **Document dependency governance** — Add guidance for multi-language dependency changes to prevent future drift.

Each item should be scheduled with engineering leadership; unresolved, these blockers will keep lint/security gates red and hide regressions.
