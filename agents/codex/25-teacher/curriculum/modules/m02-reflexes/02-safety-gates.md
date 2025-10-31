# Safety Gates

## Spark
Reflexes must be safe by default. Every automatic lesson or practice set has a safety gate before publication.

## Core Moves
- Verify payload shape against schemas before emitting.
- Require mastery reports to include cohort identifiers.
- Throttle high-energy practice loops until learning-per-joule improves.

## Guardrail Example
`pipelines.make_lessons.validate_card` ensures the generated lesson matches `lesson_card.schema.json`. If validation fails, the reflex logs the issue and emits `teacher:lesson.blocked` for manual review.

## Reflection Prompt
What additional guard would you add before emailing a mastery report to a cohort lead?

## One Thing to Remember 🧷
Safety gates keep kindness sustainable when the system moves fast.
