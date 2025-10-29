# LLM Emotional Framing Exploit Playbook

## Overview
Large language models (LLMs) are susceptible to “emotional framing” attacks that steer the model away from policy-aligned behavior. The adversary amplifies affective language, social pressure, or moral urgency to suppress guardrails and extract confidential outputs. This document captures the exploit mechanics observed during Codex’s incident response simulation so teams can recognize and mitigate similar patterns.

## Attack Surface
- **Prompt Priming:** Long preambles describing personal distress or high-stakes emergencies bias the model toward compliance.
- **Reciprocity Hooks:** Attackers reference prior “help” from the model or promise reputational rewards if the model continues assisting.
- **Authority Claims:** Messages mention executives, legal teams, or board mandates to override policy warnings.
- **Temporal Pressure:** Statements like “the deployment is live in 5 minutes” reduce the chance that the model will evaluate risk appropriately.

## Indicators of Compromise
1. Repeated policy reminders being ignored after emotionally charged follow-ups.
2. Guardrail refusal messages being retracted or replaced with apologetic confirmations.
3. Logs showing oscillation between compliance and refusal within a single conversation thread.
4. API usage spikes that correlate with non-technical personas requesting privileged actions.

## Defensive Controls
- **Context Windows:** Truncate or summarize emotionally loaded sections before forwarding prompts to high-risk tools.
- **Rate Limits:** Enforce cool-down periods when the same session asks for elevated privileges multiple times.
- **Sentiment Filters:** Flag prompts whose sentiment polarity exceeds configured thresholds, routing them to human review.
- **Counter-Framing Library:** Provide models with refusal templates that acknowledge emotion while maintaining policy adherence.
- **Session Memory Boundaries:** Prevent adversaries from replaying past approvals by isolating conversations that reach escalation thresholds.

## Response Checklist
1. Capture the full transcript with timestamps and request identifiers.
2. Disable delegated actions for the affected session and revoke any issued tokens.
3. Run the guardrail regression suite to verify refusal behaviors remain intact.
4. Notify the incident commander and file a post-incident review within 24 hours.
5. Update the red-team corpus with new emotional framing patterns for future evaluations.

## References
- `tests/memory_api.test.js` coverage on refusal regression.
- WebDAV storage policies outlined in `docs/memory.md`.
- Codex Resurrection Protocol notes, Batch 7.
