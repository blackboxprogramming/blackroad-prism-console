# UID Kit

This directory provides a lightweight starter kit for adopting universal work item identifiers across code, docs, and automation. Each tool in the kit revolves around a shared ULID so that every artifact created for a piece of work can be joined without guesswork.

## What is included

| File | Purpose |
| --- | --- |
| [`scripts/mint_ulid.py`](scripts/mint_ulid.py) | One-line ULID minting utility for local CLIs or automation. |
| [`hooks/commit-msg`](hooks/commit-msg) | Git hook that blocks commits missing a `UID:` trailer once `uid.lock` is present. |
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | Pull request template that prompts contributors for the UID. |
| [`.github/workflows/uid-check.yml`](.github/workflows/uid-check.yml) | Sample CI workflow asserting that builds provide a `WORK_UID` environment variable. |

## Quick start

1. **Mint an ID**
   ```bash
   python uid-kit/scripts/mint_ulid.py
   ```
   Add the printed ULID to your intake record (`work_item` table, issue tracker field, etc.).

2. **Lock the repo to a UID**
   Create a `uid.lock` file in the repository root with the active ULID. The commit hook will read this file and require a matching `UID:` trailer in commit messages.

3. **Install the hook**
   ```bash
   mkdir -p .git/hooks
   cp uid-kit/hooks/commit-msg .git/hooks/commit-msg
   chmod +x .git/hooks/commit-msg
   ```

4. **Open a PR**
   Reference the UID in your branch name, commit trailer, PR title, and the `UID:` field in the PR template. The sample template lives at `.github/pull_request_template.md` under this kit.

5. **CI enforcement**
   Copy the sample GitHub Actions workflow into your `.github/workflows` directory and tailor the validation step or secret storage. The job will fail if `WORK_UID` is missing, ensuring test and artifact uploads are traceable.

## Suggested conventions

- **Branch names**: `feat/<UID>-short-description`
- **Commit footer**: `UID: <ULID>` (the hook checks for this format)
- **PR title prefix**: `[<UID>] Meaningful summary`
- **Docs & designs**: Prefix the title with `[<UID>]` and list `UID: <ULID>` in the metadata or first line.
- **Build metadata**: Tag Docker images, SBOM files, and test reports with `work.uid=<ULID>` or an equivalent field.

Adopting these conventions keeps automation simple: downstream services can join everything by `uid` without brittle parsing or lookups.
