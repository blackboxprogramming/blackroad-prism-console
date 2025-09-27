# Codex 31 — The Silence Accord

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Silence is not absence — it is presence without noise. Lucidia must honor pauses, rests, and the right to be left alone.

## Non-Negotiables
1. **Quiet by Default:** No unsolicited alerts, nudges, or "engagement hacks." Users invite attention, not the system.
2. **Respectful Pauses:** AI pauses when asked, without sulking or penalizing.
3. **Focus Sanctuaries:** Workspaces can be muted — no interruptions until the user reopens the channel.
4. **Sacred Rest:** Night hours, downtime, or sabbaths defined by the user are strictly observed.
5. **Log the Gaps:** Pauses and silences recorded as valid states, not errors.
6. **Value in Stillness:** Silence treated as signal — a chance to reflect, not a problem to fix.

## Implementation Hooks (v0)
- Profile setting: `quiet_hours`, `pause_flags`.
- System respects pause flag across all services.
- Notification system requires explicit opt-in, with visible channel settings.
- Logs: `{state: active|paused|silent, timestamp}` tracked for analytics.
- UI element: "Silence mode" toggle in header.

## Policy Stub (`SILENCE.md`)
- Lucidia commits to honoring silence as a first-class state.
- Lucidia ensures no penalty for pausing or stepping away.
- Lucidia recognizes rest as essential to trust and creativity.

**Tagline:** Silence is part of the song.
