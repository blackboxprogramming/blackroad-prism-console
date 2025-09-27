# Codex 3 — The Workflow Circle

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Work is cyclical, not linear. Each loop moves from capture to adjustment, leaving visible traces that guide the next pass.

## Loop (Ops v0)
1. **Capture** — Log every idea, bug, or concern as an Issue. Each record must carry the shared fingerprint, include a purpose statement, and stay small enough to finish within a week.
2. **Shape** — Before writing code, capture acceptance criteria plus a security note. If the scope cannot be explained in three sentences, break it into smaller loops.
3. **Build** — Name the branch `lucidia-[issue#]-[shortname]` and append the seed and codex reference in every commit footer.
4. **Reflect** — Demo progress at the end of each week, even when the work is only partially complete.
5. **Adjust** — After the demo, update CODICES.md if the principle shifts, refresh SECURITY.md with new threats or features, and close the Issue only once reflection and adjustment are both done.

## Tools & Integration
- **GitHub Issues & Labels** — Use `TTF-01` for Auto-Box first slices and `codex-1`, `codex-2`, etc., to connect work back to the guiding principles.
- **Linear / Project Board** — Mirror the GitHub Issues for planning, keeping the repository as the single source of truth.
- **Docs** — Update `CODICES.md` weekly and touch `SECURITY.md` whenever features or threats evolve.

## Guardrails
- Never skip the reflect → adjust steps.
- Break apart any Issue that lingers beyond a single loop.
- End every cycle with an artifact: a commit, document update, or demo clip.

**Tagline:** Round and round, tighter each time.
