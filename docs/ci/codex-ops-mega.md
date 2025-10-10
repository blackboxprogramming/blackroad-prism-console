# Codex Ops Mega Bundle Intake

The "codex-ops-mega" bundle consolidates the previously delivered CI/CD, release-automation, and ChatOps assets into a single archive (`codex-ops-mega.zip`). This document captures the prep work required to adopt the bundle inside **blackroad-prism-console**.

## 1. Obtain the Archive

Download the `codex-ops-mega.zip` asset from the provider once the distribution URL is available. Store it in a temporary location (e.g., `./downloads`).

```bash
export CODEX_OPS_MEGA_URL="<bundle-url>"
./scripts/download_codex_ops_mega.sh
```

The helper script handles checksum validation and keeps previous downloads if the network is unavailable.

## 2. Stage Files into the Repository

After downloading the archive:

1. Extract it to a staging directory:
   ```bash
   unzip downloads/codex-ops-mega.zip -d downloads/codex-ops-mega
   ```
2. Copy the provided `.github/` resources and supporting scripts into the repository root, preserving the directory structure.
3. Review the resulting diffs carefully. Remove stacks that are not needed for **blackroad-prism-console** before committing.

## 3. Repository Configuration Checklist

The bundle expects the following repository-level configuration:

- **Actions → General**: enable GitHub Actions and allow reusable workflows from the organization.
- **Branch protection**: enforce pull requests and select 1–3 required checks using the provided emoji names.
- **Labels**: create the labels referenced by the workflows (`automerge`, `no-rerun`, `no-test-change-required`, `update-branch`, `backport-<branch>`, etc.).
- **Packages**: if preview environments are enabled, ensure GitHub Container Registry publishing permissions include `write` access.

## 4. Adoption Strategy

Because the bundle spans multiple language and deployment lanes (Node, Python, Go, Java, Ruby, PHP, Rust, .NET, container previews, SBOM, vulnerability scanning, release drafting, backports, etc.), plan a phased rollout:

1. **Inventory the active stacks** for this repository and disable unused workflows up front.
2. **Map secrets and permissions** required by each workflow. Populate repository secrets before enabling the workflows.
3. **Run a dry-run** in a feature branch to confirm the workflows execute successfully.
4. **Document overrides** (timeouts, concurrency limits, artifact retention) so future updates remain traceable.

## 5. Maintenance

- Track upstream bundle revisions. When a new archive is published, repeat the download and staging process, reviewing diffs for breaking changes.
- Keep the helper script (`download_codex_ops_mega.sh`) updated with any new verification steps (e.g., checksum changes).
- Capture production learnings in this document so future updates remain smooth.

> **Note**: At the time of writing, the official download endpoint has not yet been provided. Update this guide with the permanent URL and checksum once available.
