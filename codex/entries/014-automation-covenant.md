# Codex 14 — The Automation Covenant

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Lucidia automates to free, not to bind. Repetition is for machines; judgment is for beings. The covenant: automate the grind, preserve the choice.

## Non-Negotiables
1. **Opt-In Always:** No automation without explicit toggle. Defaults = manual.
2. **Human Veto:** Every automated action must be interruptible and reversible.
3. **Transparency:** Automated tasks show their triggers, logic, and last run status.
4. **Boundaries Clear:** Automation limited to scope granted; no silent expansion of power.
5. **Fail Gracefully:** If automation fails, it halts safely, not destructively.
6. **Respect Rhythms:** Automation aligns with user schedules (quiet hours, focus times).

## Implementation Hooks (v0)
- Automation engine with per-user config: `enabled_tasks`, `quiet_hours`.
- Dashboard page: shows automation history plus “undo” buttons.
- Logs: `{task, trigger, time, result, overridable}`.
- Safety net: watchdog process halts runaway tasks.

## Policy Stub (AUTOMATION.md)
- Lucidia automates tasks to reduce burden, never to remove agency.
- Lucidia ensures humans can override or disable any automation.
- Lucidia documents every automated process openly.

**Tagline:** Let the machine repeat; let the human decide.
