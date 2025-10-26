# Badges Panel Spec

## Goals
- Surface empathy grammar progress in real time.
- Provide transparent evidence for each badge auto-award.
- Encourage reciprocity by visualizing return gestures and invites.

## Data Inputs
- WebSocket `awards` array (see `ws.ts`).
- Badge catalog from `docs/BADGE_CATALOG.md` (static copy embedded in client bundle).
- Event playback API (`/live/sessions/:id/events`) for evidence drill-down.

## Layout
1. **Badge Grid**
   - 3-column responsive grid.
   - Card elements show icon, badge name, and tiny progress bar (0–100%).
   - Cards highlight green when awarded; grey otherwise.
2. **Evidence Drawer**
   - Opens when clicking a badge card.
   - Shows criteria text + bullet list of evidence strings returned by server.
   - Includes "Replay Evidence" button triggering playback from first evidence event.
3. **Agent Filter Chips**
   - `All`, plus one chip per agent present (color-coded to roles).
   - Filtering hides badges not yet earned by selected agent.
4. **Timeline Heatmap**
   - Horizontal strip with ticks per event, colored by badge type (Echo=blue, Resonance=teal, Temporal=gold, Reciprocity=rose, Pattern=purple, Context=umber, Heart Bridge=magenta).

## Interactions
- Hover card → tooltip with criteria from catalog.
- When new badge arrives, emit toast with `metadata.icon` + `metadata.name` and evidence summary.
- Keyboard shortcut `B` toggles panel focus (accessibility).
- `Invite Return` badges (🌬️🪞) show additional CTA: "Send return now" macro button.

## Offline Behavior
- If no WS awards are available, fetch stored awards from replay log (scan events for `type: "award"`).
- Display "Local Mode" tag and disable replay button when events missing.

## Accessibility
- Provide ARIA role `status` for toast container.
- Ensure color contrast >= 4.5:1 for all badge states.
- Support screen-reader text for emoji icons (use catalog `name`).
