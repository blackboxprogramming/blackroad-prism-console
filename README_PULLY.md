# Pully - Pull Request Organizer

Pully is a small, local utility to help organize incoming pull requests. It analyzes a PR (provided as JSON), suggests labels, reviewers, and outputs a small checklist.

Purpose
- Run as a dry-run in CI to suggest labels/reviewers without touching GitHub.
- Be easily extendable with simple JSON rules for keywords, file patterns, and reviewer hints.

Usage
1. Prepare a PR JSON file with keys: `title`, `body`, `author`, `files` (list), `labels` (optional list).
2. Run:

```bash
python tools/pully.py --config tools/pully_config.example.json --pr-file example_pr.json
```

Configuration
- `tools/pully_config.example.json` contains simple examples for `label_rules`, `file_rules`, and `reviewer_rules`.

Extending
- Add more rules to the example config. File patterns are regular expressions. Keywords are simple substrings.

Notes
- This tool is intentionally offline-first; network integration (GitHub API) can be added later behind an opt-in switch.
