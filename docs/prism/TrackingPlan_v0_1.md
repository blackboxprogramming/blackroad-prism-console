# PRISM v0.1 — Tracking Plan

## Client / App Events
| Event | Properties | Notes |
| --- | --- | --- |
| `PRISM View Dashboard` | `tiles_rendered` (int), `time_to_first_paint_ms` (number) | Fire on dashboard mount; include counts of visible tiles. |
| `PRISM Click ConnectSource` | `source_type` (string) | Triggered when user taps the connect CTA. |
| `PRISM Complete Onboarding` | `steps_completed` (int) | Emit when checklist hits 3/3; handle partial completions if user exits early. |

## Server Events
| Event | Properties | Notes |
| --- | --- | --- |
| `PRISM Source Connected` | `source_type` (string) | Fire when connector validates token and persists config. |
| `PRISM Auth Success` | `provider` (string: `magic_link`, future `slack`) | Emitted on successful session creation. |

## Routing
- Primary sink: analytics pipeline → `stg_app__events` table.
- Mirror into warehouse for BI access.
- Ensure dashboard loads gracefully if telemetry endpoint is unavailable (non-blocking).
