# QA Status Overview

## JavaScript / TypeScript
- **Suite:** `npm test -- --coverage`
- **Location:** Root `package.json`
- **Result:** ❌ Failed — `package.json` is not valid JSON due to duplicated keys and malformed script definitions, preventing npm from running tests.
- **Coverage:** Not generated (tests did not execute).
- **Notes:** `frontend/package.json` defines build-only scripts; no unit test command is available for the Vite frontend bundle.

## Go
- **Suite:** `go test ./...`
- **Location:** Root `go.mod` / `go.work`
- **Result:** ❌ Failed — `go.work` references modules with invalid `go.mod` files (duplicate `module`/`go` declarations) and requires Go 1.23 while workspace is pinned to 1.21.
- **Coverage:** Not generated (tests did not execute).

## Python
- **Suite:** `pytest --maxfail=1 --disable-warnings -q`
- **Location:** Root `pyproject.toml`
- **Result:** ❌ Failed — `pyproject.toml` declares `[project.scripts]` twice, causing pytest configuration parsing to abort.
- **Coverage:** Not generated (tests did not execute).

## Summary
All automated test suites are currently blocked by configuration errors in their respective package manifests. Fixing the manifest issues is required before test execution and coverage collection can proceed.
