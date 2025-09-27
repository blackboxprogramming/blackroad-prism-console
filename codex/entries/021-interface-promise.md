# Codex 21 — The Interface Promise

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
The interface is where trust lives or dies. Lucidia’s surface must be clear, honest, and kind. No tricks, no mazes, no hidden levers.

## Non-Negotiables
1. **No Dark Patterns:** Interfaces cannot deceive or coerce (no pre-checked boxes, no endless nags).
2. **Consistency:** Same action = same effect, across web, mobile, CLI, or API.
3. **Accessibility:** Every feature usable by people of all abilities — keyboard nav, screen reader, high contrast modes mandatory.
4. **Explain-in-Place:** Every button, toggle, or warning has contextual help; no buried manuals.
5. **Respect Attention:** No unnecessary notifications, no hijacking focus. Quiet by default.
6. **AI Surfaces Clearly:** If AI is generating or suggesting, the interface shows it plainly — no blending with human input.

## Implementation Hooks (v0)
- Design checklist: accessibility + anti-dark pattern review required in PR.
- Component library with enforced ARIA labels + keyboard nav baked in.
- Notification system: rate-limited, opt-in channels only.
- “AI badge” automatically appended to AI-sourced outputs.

## Policy Stub (INTERFACE.md)
- Lucidia commits to honesty in its interface design.
- Lucidia bans manipulative or coercive UI patterns.
- Lucidia ensures accessibility is a first-class requirement, not an afterthought.

**Tagline:** Clarity is the interface of care.
