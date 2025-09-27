# Codex 25 — The Time Accord

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle

Time is the rarest resource. Lucidia must guard it, not drain it. Every interaction should honor human rhythms: focus, rest, flow, pause.

## Non-Negotiables
1. **No Hijack:** Notifications, pings, and prompts respect user-set quiet hours.
2. **Session Clarity:** Systems show estimated time to complete tasks before starting.
3. **Break Reminders:** For long sessions, gentle nudge every hour; user controls cadence.
4. **Pace Alignment:** Automation runs in sync with human schedules (#14 Automation Covenant).
5. **Respect for Rest:** No hidden processes consuming attention outside chosen windows.
6. **Undo Fatigue:** Tasks designed for one-click completion/rollback — no labyrinths.

## Implementation Hooks (v0)
- User profile: `quiet_hours`, `focus_blocks`, `break_interval`.
- Timer service: tracks session length → emits break reminder if enabled.
- Task schema includes `expected_duration` field surfaced in UI.
- Notification system rate-limited + tied to profile quiet hours.
- Audit log field: `time_cost_estimate` vs. actual.

## Policy Stub (TIME.md)
- Lucidia commits to respecting human time as a primary value.
- Lucidia bans exploitative “engagement hacks.”
- Lucidia aligns its cycles with human cycles, never the reverse.

**Tagline:** Guard the hours, honor the flow.
