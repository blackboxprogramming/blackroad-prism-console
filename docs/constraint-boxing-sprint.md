# Constraint Boxing Sprint

1. **Problem:** Team members delay shipping small console improvements because they lack a lightweight decision template to unblock themselves.

2. **Constraints:**
   - **C1:** Must be asynchronous so no live meetings are required.
   - **C2:** Must use existing internal tools (docs repo + Slack) with zero new purchases.
   - **C3:** Must be shippable in under 10 minutes of maker time.

3. **Solution A — obeys all 3 constraints:**
   1. Publish a three-step markdown template in the docs repo guiding teammates through constraint boxing and linking to the Slack announcement channel.
   2. Share the template asynchronously by posting the repo link in Slack with instructions to duplicate it for their tasks.
   3. Include a checklist that keeps each micro-shipping activity under ten minutes by focusing on defining scope, action, and success criteria.

4. **Solution B — breaks exactly one constraint:**
   - **Breaks:** C2
   1. Adopt a lightweight paid decision-tracking SaaS that bundles timers, notifications, and template enforcement.
   2. Embed the SaaS widget into our workflow so each contributor fills it out before starting work.
   3. Use its analytics dashboard to highlight shipping velocity wins in weekly leadership updates.
   - **Why it's worth breaking C2:** The SaaS provides built-in analytics and reminders we cannot currently automate, potentially improving adoption despite the cost.

5. **Winner:** Solution A.

6. **5-minute micro-prototype:**
   - **Deliverable:** Publish this filled-in constraint boxing sprint template as a markdown doc teammates can duplicate.
   - **Where it lives:** `docs/constraint-boxing-sprint.md` in the docs repo.
   - **Success check:** Document merged into main with link shared in #console-shipping channel.

7. **Timer:** Ship immediately after committing this document.
