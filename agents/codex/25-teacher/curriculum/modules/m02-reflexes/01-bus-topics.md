# Reflex Bus Topics

## Spark
The event bus is Teacher's nervous system. Topic hygiene keeps reflexes predictable and debuggable.

## Core Moves
- Use namespace prefixes like `teacher:lesson.created`.
- Keep payloads small and validated.
- Add energy hints so downstream agents know the cost of reacting.

## Worked Example
In `hooks/on_quiz_submitted.reflex.py`, the handler receives quiz results, asks `pipelines.make_practice.next_practice_set` for the next bundle, and emits `teacher:practice.next` with a structured payload.

## Practice Prompt
Design a topic for hint level escalations. What fields must the payload include to respect the mastery threshold?

## One Thing to Remember 🧷
Clear topics keep the slowest learner from waiting on a jammed bus.
