# Codex CI Templates

This directory contains a drop-in CI starter kit for Codex repositories. It includes:

- 50 emoji-forward workflow templates covering 10 languages and 5 runtime versions each.
- A reusable composite action (`.github/actions/run-tests`) that installs toolchains and executes your test command consistently.
- Automation helpers for day-to-day PR operations:
  - `🔁 Auto Re-run Failed CI` retries flaky runs (up to three attempts).
  - `🧹 Cleanup on Merge` deletes merged branches from same-repo pull requests.
  - `🤖 PR Ops` labels new pull requests and posts a reminder comment.
- Sample `CODEOWNERS` and labeler configuration to bootstrap review routing.

## How to use the templates

1. Pick the workflow file(s) for your stack from `.github/workflows/` in this folder.
2. Copy them into your repository's top-level `.github/workflows/` directory.
3. Adjust the `test_command` input if your project uses a custom script.
4. Commit the workflows to your default branch and enable them in branch protection.

The composite action automatically:

- Installs the requested language runtime version.
- Restores dependencies using sensible defaults (npm/pnpm/yarn, pip, bundler, composer, etc.).
- Runs the resolved test command (or the override you supply).

## Included automation

- `cleanup-on-merge.yml`: removes merged PR branches created in the same repository.
- `rerun-on-failure.yml`: re-runs failed CI workflows on pull requests up to three times and leaves a status comment.
- `pr-ops.yml`: applies a `status: awaiting-ci` label and drops a short onboarding note when a PR opens.

These workflow files live at the repository root so they execute automatically once committed.

## CODEOWNERS & labels

`CODEOWNERS` and `.github/labeler.yml` provide sensible defaults. Update the file globs and owners to match your team's structure.

## Need a custom matrix?

If you maintain a monorepo or need bespoke test commands, copy the closest template and update the `test_command` (or add matrices) before committing it to `.github/workflows/`.
