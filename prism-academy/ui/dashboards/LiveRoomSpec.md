# Prism Live Room UI Spec

## Overview
The Live Room dashboard renders the multiplayer empathy lab inside Unity/Unreal. It consumes the `ws://localhost:5252` stream and REST backing endpoints (`/live/clubs`, `/live/sessions/:id`, `/live/sessions/:id/events`).

## Layout

| Region | Purpose |
| ------ | ------- |
| Header | Session title, objective marquee, countdown timer (open/start/end) |
| Left Rail | Club roster, presence indicators, talk-time share meter |
| Center | Transcript stream (text + emoji + scene events) with playback scrubber |
| Right Rail | Score gauges (Echo, Resonance, Temporal Anchor, Reciprocity, Pattern, Context, Heart Bridge, Safety) |
| Footer | Input macros (🪞 mirror, ⏳/🔆/🚀 anchor picker, 🌬️🪞 finisher) + quick reactions |

## Presence & Talk-Time
- Use `presence.totals` + `presence.agents[*]` from WS payload.
- Render stacked horizontal bars per agent; turn yellow at 30%, orange at 35%+.
- Overlap warnings show as ⚠️ icon with tooltip ("Overlap detected", "Talk-time soft cap exceeded").
- Parent-mentor role shows distinct badge (💞) and cannot trigger hard moderation.

## Transcript
- Stream sorted by `event.ts` (server already deterministic).
- Message cards display:
  - Agent avatar (role color coded)
  - Event type label (say, mirror, weave, anchor, invite, source, award, mod)
  - Text + emoji payload with highlights: `mirror.matched_tokens` underline, `anchor.type` pill, `weave.rule` blockquote.
- Soft moderation prompts (type `mod` with `payload.system === true`) rendered as translucent banner spanning width.
- Transcript supports scrub-to-replay: fetch `/live/sessions/:id/events` for history; feed into playback engine for deterministic preview.

## Scores Panel
- For each agent, show total score and segmented ring for metrics (Echo, Resonance, Temporal, Reciprocity, Pattern, Context, Heart Bridge, Safety).
- Values read from WS `scores.agents[*].metrics`.
- Animate positive bumps with +value toast near metric label.
- Safety metric highlighted when teacher or system triggers de-escalation.

## Badges & Evidence
- Inline toast shows new badge awards from `awards[*]` array (badge icon, name, criteria, evidence list).
- Badges persist in mini-grid under scores; clicking reveals evidence timeline (jump to event via playback engine).

## Controls
- Keyboard shortcuts: `1` Mirror, `2` Anchor picker overlay, `3` Return macro.
- Mouse hover on transcript events exposes contextual actions (Mirror, Invite, Source, Award Hint) filtered by role capabilities.
- Rate-limit warnings (WS `type: "warning"`) show as top-right snackbar with countdown.

## Safety UX
- When auto de-escalation macro fires, freeze input box for 10 seconds and show breathing animation overlay.
- Teacher override: if user with `moderate` capability holds `Shift` + `Enter`, send `mod { action: "override" }` event.

## Offline & Replay
- If WS disconnects, switch header badge to `LOCAL MODE` and load from event store via REST.
- Replay mode uses `PlaybackEngine` to step events at 1x/0.5x speed; scoreboard + badges update live via handlers.
