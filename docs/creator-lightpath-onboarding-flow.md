# Creator Lightpath Onboarding Flow (v0.1)

This pack captures the three-screen onboarding loop for the Creator lightpath experience and the fastest ways to mock it with live-ish feedback.

## Flow Summary

- **Step 1 – Welcome:** Set the emotional hook with the promise: *"You create. We handle the rest."* Keep the copy minimal and point to the under-10-minute loop.
- **Step 2 – Upload:** Ask for one flagship asset (video, image, or text). Show a mock RoadCoin balance underneath with copy reinforcing that it will update when the work is live.
- **Step 3 – Live + Reward:** Mirror the live experience: surface view count, gently increasing RoadCoin earned, and a Stripe payout rehearsal. Close with the "Welcome to the first five" line once the user hits **Claim Reward**.

## Screen Specs

### Screen 1 – Welcome
- **Headline:** *You create. We handle the rest.*
- **Body copy:** "A short demo run to test upload → publish → payout. Takes under 10 minutes. You’ll see your reward appear live."
- **Primary CTA:** `Let’s Start`

### Screen 2 – Upload
- **Prompt:** “Drop in one piece you’re proud of.”
- **Supported types:** video / image / text (accept any file for the mock).
- **Status bar copy:** “You’ll see this number change when your work goes live.”
- **Primary CTA:** `Publish` (only active once a file is chosen).

### Screen 3 – Live + Reward
- **Headline:** *It’s up.*
- **Micro-animation:** light confetti treatment when the screen loads.
- **Tile contents:** view count, RoadCoin earned (auto-increments), Stripe payout test button.
- **Primary CTA:** `Claim Reward`
- **Post-CTA message:** “Welcome to the first five. You just closed the loop.”

## Interaction Notes

- Keep the entire loop under three clicks: Start → Publish → Claim Reward.
- Auto-increment the view count and RoadCoin value for ~5 seconds so the user literally watches the balance change.
- The Stripe payout test button should flip to a confirmed state and unlock the final line of copy.
- Provide a visible balance delta so the before/after story is obvious to the user.

## Rapid Mocking Toolkit

| Need | Tool | Notes |
| --- | --- | --- |
| Static frames | **Figma** + FigJam | Drop the copy deck into Figma AI to spin up frame variants; keep the palette dark with neon gradients to match the console aesthetic. |
| Interactive prototype (no code) | **Framer** or **Bravo Studio** | Use drop-in interactions to simulate the balance tick and confetti. Ideal for lightweight user interviews. |
| Live coded stub | **Vite + React** (the `sites/blackroad` sandbox) | The new `CreatorLightpath` page renders the exact three-step flow with mock counters, payout rehearsal, and copy so PMs/Design can tweak directly in code. |
| Motion polish | **LottieFiles** or **Haikei** gradients | Quick confetti or background ambient loops that can be exported to JSON/SVG and embedded later. |
| Usability capture | **Loom** or **Fathom** | Record the first five testers completing the loop so the rest of the team can see the emotional beat land. |

## Next Up

1. Validate the copy and pacing with 3–5 creators — capture where they hesitate.
2. Decide whether to gate the full dashboard until this loop is completed in production.
3. If the response is strong, upgrade the confetti to a reusable animation and wire in real payout webhooks.

