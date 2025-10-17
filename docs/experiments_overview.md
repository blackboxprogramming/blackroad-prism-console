# Experiments Visibility Playbook

Understanding "seeing everything" in a research-heavy repository can mean different things depending on whether you want code-level changes, data artifacts, or the takeaways that experiments produced. This playbook provides practical ways to surface each perspective and suggests a lightweight ritual for keeping discoveries indexed.

## 1. Code surface area

| Goal | Command(s) | Notes |
| --- | --- | --- |
| List recent edits across the repo | `ls -lt` (top level) or `fd . -td -x ls -lt {}` | Sorts by modification date so the freshest work floats to the top. |
| Explore commit history | `git log --oneline --graph --decorate` | Follow up with `git show <commit>` to replay individual experiments. |
| Diff a branch or change set | `git diff main..HEAD` or `gitk` / VSCode Source Control | Helps you visualize how an experiment diverged and converged. |

### Focused filters

- **Feature flags / keywords**: `rg "experiment"` (code), `rg "notebook"` (data pipelines), or any tag you use to earmark exploratory work.
- **Directory scopes**: If experiments live under `experiments/`, run `fd . experiments -t f` or `find experiments -type f -print` to enumerate them quickly.

## 2. Data & artifacts

| Goal | Command(s) | Notes |
| --- | --- | --- |
| Locate generated datasets | `find data -maxdepth 2 -type d -mtime -7` | Adjust depth/mtime to surface fresh outputs. |
| Inspect experiment logs | `rg "SUCCESS" logs/experiments` or `tail -f logs/experiments/*.log` | Fast sweep for pass/fail signals in log directories. |
| Compare metric snapshots | `diff metrics/expA.json metrics/expB.json` or use Jupyter diffing tools | Useful when metrics are stored as JSON/CSV. |

## 3. Meaning & synthesis

1. Create (or update) `experiments/experiments_index.md`.
2. For every experiment, add a single line with:
   - Date (`YYYY-MM-DD`)
   - Pointer (`experiments/br_math/abacus_gate.py` or a notebook link)
   - One-sentence insight or status.
3. Optionally add tags (e.g., `#nlp`, `#benchmark`, `#regression`) for quick filtering.

Having this running index makes it trivial to answer "what have we tried and what did we learn?"—the "meaning" view.

## 4. Cadence checklist

- [ ] End-of-day: append new experiments to the index.
- [ ] Weekly: prune stale experiment branches with `git branch --merged`.
- [ ] Monthly: snapshot high-value learnings into the project README or a decision log.

## 5. Next steps

Choose the lens you need right now:
- **Code**: run the Git/history commands above and review diffs.
- **Data**: scan logs and datasets for the latest outputs.
- **Meaning**: start or update the experiment index so lessons stay visible.

Let me know which path you want to go deeper on and I can script the queries or help automate the index.
