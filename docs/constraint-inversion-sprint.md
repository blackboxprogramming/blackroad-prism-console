# Constraint Inversion Sprint

A 10-minute micro-practice for breaking out of ruts and exploring non-obvious options.

## Why it works
Flipping a hard constraint forces you to search new solution paths instead of optimizing a stale plan. The pattern works for engineering, product, ops, security, and more.

## Run it (10 minutes total)
1. **Ugly First Draft (2 min)**
   - What hurts?
   - Who's affected?
   - What would "good" look like this week?
2. **Flip One Constraint (7 min)**
   - Pick one constraint to invert (examples below).
   - Generate 3 radically different approaches (~2 min each).
   - Capture sketches, not specs.
3. **Most Testable Today (1 min)**
   - Circle the idea with the smallest, fastest test you can run today (≤ 1 hour).
   - Define what you'll learn from success or failure.

### Constraint menu
- Zero budget
- Offline-only
- No secrets
- No backend
- Only CLI / SMS
- 24-hour deadline
- Single file deploy
- Read-only data
- No meetings
- Other — make up your own

## One-page template
```
Problem – ugly first draft (2 min):
  • Pain:
  • Who’s affected:
  • “Good by next week” means:

Flip picked (choose one):
  ☐ Zero budget   ☐ Offline-only   ☐ No secrets   ☐ No backend
  ☐ Only CLI/SMS  ☐ 24-hour deadline  ☐ Single file deploy
  ☐ Read-only data  ☐ No meetings  ☐ Other: ______

Three approaches (7 min, bullets ok):
1)
2)
3)

Pick one (1 min):
  • Smallest test I can run today:
  • What success/failure teaches us:
  • First action (start now):
```

> Tip: run `python -m cli.console creativity:constraint-inversion` for an interactive walkthrough.
