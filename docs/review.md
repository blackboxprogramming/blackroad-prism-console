# Lucidia Peer-Review Agent

The Lucidia Peer-Review Agent provides an offline, language-agnostic
review pipeline.  It mirrors NDAS concepts such as baseline versus
change diffs, iterative reviews, and bulk triage while remaining vendor
neutral.

## Usage

### Command line

```bash
lucidia-review path/to/changes
```

### Pre-commit

The repository's `.pre-commit-config.yaml` runs a fast subset via
`lucidia-review --fast`.

### CI

Self-hosted runners execute `scripts/review.sh` through
`ci/review.yml`.  The same script can be called by cron or other
automation.

## Policy

Configuration lives in `config/review-policy.yaml` and defines
complexity thresholds, coverage floors, and allowed licenses.

## Baseline promotion

The tool will eventually store review state in Git notes under
`refs/notes/lucidia-review`.  Use `lucidia-review --accept` (not yet
implemented) to update the baseline after all findings are addressed.
