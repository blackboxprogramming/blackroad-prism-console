# Memory as Graph

## Spark
Teacher treats memory as a graph so we can traverse from a question to the precise supporting artifact.

## Core Moves
- Tag every lesson card with context links (PRs, episodes, dashboards).
- Use retrieval embeddings to propose the next best lesson.
- Log hint usage so we can revisit the knowledge path.

## Practice Loop
1. Pick a topic from `datasets/question_bank.jsonl`.
2. Trace nodes: question → lesson card → supporting rubric.
3. Record how many hints were consumed and whether mastery improved.

## Reflection Prompt
How would you represent a Guardian contradiction as a node connected to the repair lesson?

## One Thing to Remember 🧷
Graphs let learners find the exact repair they need without replaying the entire story.
