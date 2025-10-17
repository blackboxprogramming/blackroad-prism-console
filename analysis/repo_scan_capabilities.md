# Repository Scan Capabilities

This environment gives you shell-level access to the repository, allowing you to:

- Inspect files with standard command-line tools (`ls`, `cat`, `rg`, etc.).
- Run local test suites and linters using the tooling defined in the repo.
- Create and execute helper scripts for repeatable analysis.
- Modify the codebase, commit changes, and prepare pull requests.

## Automated scanning helper

Use [`tools/repo_scan.sh`](../tools/repo_scan.sh) to perform a quick keyword-based sweep for potential errors or TODO items:

```bash
./tools/repo_scan.sh
```

The script reports:

1. The total number of tracked and untracked files.
2. Keyword statistics and contextual excerpts for `error`, `fail`, `exception`, `todo`, and `fixme`.
3. The latest five commits for quick historical context.
4. Suggested next steps for deeper investigation.

## Additional suggestions

- Expand the keyword list with project-specific markers (e.g., `panic`, `lint`, `xxx`).
- Integrate test commands (such as `pnpm test`, `pytest`, `go test`) for the subsystems you care about.
- Funnel the output into a markdown report for sharing with teammates.
- Review CI/CD dashboards on your hosting platform for failed pull requests; remote network access is not available directly from this environment.

By combining local scans with external CI data, you can build a comprehensive view of repository health.
