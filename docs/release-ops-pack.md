# Release & Operations Automation Pack

This repository now includes the Codex release & operations automation workflows. They provide fast release note drafting, automatic backports, PR hygiene, and guardrails around testing and linting.

## Included workflows

| Workflow | Purpose |
| --- | --- |
| `.github/workflows/release-drafter.yml` | Maintains a living draft of release notes when pull requests merge to `main` and on demand. |
| `.github/workflows/auto-backport.yml` | Opens backport pull requests when a merged PR is labeled with `backport-<target-branch>`. |
| `.github/workflows/pr-size-labels.yml` | Applies size labels (e.g., `size/S`, `size/M`) to pull requests for reviewer awareness. |
| `.github/workflows/stale-sweep.yml` | Performs a weekly cleanup pass on idle issues and pull requests. |
| `.github/workflows/update-branch.yml` | Syncs a pull request with its base branch whenever the `update-branch` label is applied. |
| `.github/workflows/codeql.yml` | Runs CodeQL security analysis for JavaScript/TypeScript and Python code. |
| `.github/workflows/lint-pack.yml` | Runs targeted `actionlint`, `markdownlint`, `yamllint`, and `shellcheck` against changed files. |
| `.github/workflows/tests-touched.yml` | Blocks code-only pull requests that do not update tests unless they carry the `no-test-change-required` label. |

## Repository labels

Create the following labels in GitHub to take advantage of every workflow:

- `automerge`
- `no-rerun`
- `no-test-change-required`
- `update-branch`
- Any required backport labels, following the `backport-<branch>` format (for example, `backport-release/1.0`).

## Maintenance branches

If you plan to use automatic backports, create the maintenance branches (e.g., `release/1.0`) before labeling merged pull requests. The backport workflow opens new PRs that target those branches.

## Operating notes

- The lint pack runs only when relevant files change, reducing noise on unrelated pull requests.
- The tests-touched gate can be bypassed by adding the `no-test-change-required` label after confirming a change truly does not need new tests.
- Release notes can be refreshed at any time via the **Run workflow** button on the Release Drafter workflow.
