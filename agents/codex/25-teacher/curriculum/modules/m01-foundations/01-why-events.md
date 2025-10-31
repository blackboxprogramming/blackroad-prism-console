# Why Events Move The Story

## Spark
Events stitch the Codex ecosystem together. Teacher starts by helping learners see events as promises: when something important happens, the right reflex wakes up without being poked.

## Core Moves
- Identify event producers in an agent workflow.
- Map the subscribers that should react.
- Describe the safety net that validates payloads.

## Worked Example
A PR merge fires `git:pr_merged`. Teacher's hook in `hooks/on_pr_merged.reflex.py` listens, validates the payload, and calls the lesson pipeline to spin a new card. Within three minutes, a builder has a learning trail connected to that change.

## Reflection Prompt
Which recent change in your project deserved an event but stayed hidden? Outline the event name and the first subscriber you would add.

## One Thing to Remember 🧷
Events make progress observable; without them, teaching stays blind.
