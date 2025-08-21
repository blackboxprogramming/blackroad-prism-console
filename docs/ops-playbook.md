# Ops Playbook — BlackRoad

## Daily

- Check CI dashboard → if warnings only, ship.
- `/deploy blackroad pages` after merging main changes.
- Review uptime issues auto-opened/closed by monitors.

## On Failure

1. Comment `/codex apply .github/prompts/codex-fix-anything.md`
2. If still red, open **Fix Anything** issue (template included).
3. Use `/rerun <workflow>` to re-trigger.

## Releases

- Rely on Release Please or manual `chore(release):` PRs.
- Badges update automatically (readme-badges.yml).
