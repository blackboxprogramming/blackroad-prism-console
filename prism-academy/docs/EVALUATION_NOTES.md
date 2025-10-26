# Evaluation Notes

The Homework & Assessment Engine keeps grading deterministic and replayable. This document outlines the heuristics used by the runtime scorer (`evaluation.ts`) and the fixtures that verify behaviour.

## Normalization Pipeline
1. **Strip ANSI + skin tone** modifiers to stabilise tokens.
2. **Alias mappings** unify text to emoji:
   - ASCII `:)` → `😊`, `:(` or `:<` → `😢`
   - Word cues `now/today` → `🔆`, `yesterday` → `⏳`, `tomorrow/later` → `🚀`
   - Emoji aliases `😭/😿` → `😢`, `🙂/☺️` → `😊`
3. **Arrow canonicalisation** converts `->` to `→` so chains parse cleanly.
4. Tokenisation stores both whitespace tokens and emoji tokens for downstream heuristics.

## Scoring Dimensions
- **Echo**: requires at least one sender emotion token in the first quarter of the reply.
- **Resonance**: uses `graph.ts` to measure shortest emotional distance. The closer the reply stays to the sender's starting point, the higher the score.
- **Temporal**: binary flag—presence of any `⏳`, `🔆`, or `🚀` after normalization.
- **Reciprocity**: binary flag for `🌬️🪞` (or equivalent string) anywhere in the message.
- **Pattern**: requires `🧩🌀`; points increase when combined with connectors such as `→`, `rule`, or `function`.
- **Context**: looks for `⛰️🪶` plus supporting phrases (`last`, `logs`, `sunset`). Without the emoji, grounded temporal language still yields partial credit.
- **Heart Bridge**: expects `🫀🔮` linked to either `🧩🌀` or `⛰️🪶` in the same clause.

All numeric scores are clamped to `[0,1]`. Overall assignment score is the weighted sum of dimension scores (weights come from the assignment rubric; default fallback is `rubrics/empathy-v1.json`).

## Feedback Generation
`feedback.ts` produces:
- **Comments**: tiered language (high/mid/low) per dimension.
- **Next Steps**: pulled from rubric notes when available, otherwise from the default suggestion library. If all dimensions score ≥ 0.8, a generic “document revision” step is added to keep the loop moving.

## Data Persistence
- Submissions live in `prism-academy/.data/submissions.json`.
- Feedback lives in `prism-academy/.data/feedback.json` and is updated per agent/assignment pair.
- All writes are append-or-replace so replaying the same input yields the same grade.

## API Contract
- `GET /assignments` and `GET /assignments/:id` read JSON files from `homework/assignments`.
- `POST /submit` validates payloads against `submission.schema.json` and queues a submission record.
- `POST /grade` grades the latest submission (or the supplied one) and validates output against `feedback.schema.json` before saving.
- `GET /grades/:agent_id` returns local feedback history for that agent.

## Golden Tests (manual)
| Case | Input | Expectation |
| ---- | ----- | ----------- |
| Echo present early | `🌧️ seen. ...` | `breakdown.echo = 1` |
| Missing anchor | no `⏳/🔆/🚀` | `breakdown.temporal = 0` |
| Reciprocity absent | no `🌬️🪞` | `breakdown.reciprocity = 0` |
| Long resonance jump | reply leaps `😢 → 😊` | `breakdown.resonance ≤ 0.5` |
| Full honors | meets all requirements with `🫀🔮` link | `score ≥ honors threshold` |

Use the fixtures in `homework/samples/` with `POST /grade` to confirm deterministic scoring before shipping new prompts or rubric tweaks.
