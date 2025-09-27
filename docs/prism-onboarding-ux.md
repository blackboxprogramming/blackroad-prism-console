# PRISM Onboarding UX Kit (v0.1)

This kit packages the starting assets for the PRISM onboarding UX track so designers and PMs can move quickly.

## Figma Wireframe Prompts

Paste the following prompts into the Figma AI plugin to spin up the baseline screens:

### 1. Sign-in Screen
- **Goal:** Minimal sign-in page for PRISM.
- **Elements:**
  - BlackRoad logo (top-center)
  - Headline: "Welcome to PRISM"
  - Subtext: "Sign in with your work email"
  - Email input + button "Send magic link"
  - Link "Use Slack SSO" (secondary)
  - Footer: "Need help? Contact support"
- **Style:** Clean, light background, generous whitespace.

### 2. Onboarding Checklist
- **Goal:** Onboarding page with progress bar.
- **Header:** "Let's get you set up"
- **Checklist:**
  1. Create org (checked if done)
  2. Connect first source (active CTA)
  3. View your dashboard (locked until 2)
- **Details:**
  - Each item has icon, title, description, CTA button.
  - Right side shows friendly illustration.
- **Style:** Clear steps, completion state, green check icons.

### 3. Dashboard (Empty State)
- **Goal:** Dashboard view with grid layout.
- **Layout:**
  - If no data: show two empty tiles side-by-side.
  - Tile 1 title: "Events (7d)"
  - Tile 2 title: "Errors (7d)"
  - Inside each: Greyed-out chart placeholder + message: "No data yet — connect a source to get started."
- **Top nav:** PRISM logo, "Dashboard", "Sources", "Settings", avatar.
- **Style:** Cards with soft shadows, white background.

### 4. Dashboard (With Data)
- **Goal:** Dashboard view with two active tiles side-by-side.
- **Charts:**
  - Tile 1: Line chart of events over 7 days (sparkline).
  - Tile 2: Line chart of errors over 7 days (sparkline).
  - Both show counts + hover tooltips.
- **Top nav:** Same as empty state.
- **Style:** Simple, high contrast charts, minimal chrome.

### 5. Sources Page
- **Goal:** Sources list view.
- **Table columns:** Source name, Type, Status, Connected At.
- **Row example:** "Source X", Type = API, Status = Active, Connected = Oct 10, 2025.
- **CTA:** "Connect new source" button top-right.
- **Empty state:** Friendly message + CTA to connect.
- **Style:** Table layout with clear labels, badge for status (green/yellow/red).

## Copy Deck (Onboarding + Empty States)

### Sign-in
- Headline: "Welcome to PRISM"
- Subtext: "Sign in with your work email"
- Button: "Send magic link"
- Alt link: "Use Slack SSO"
- Footer: "Need help? Contact support"

### Onboarding Checklist
- Header: "Let's get you set up"
- Step 1: "Create your organization"
  - Description: "We've created a space for your team."
- Step 2: "Connect your first source"
  - Description: "Pick a source to start pulling data."
  - CTA: "Connect Source"
- Step 3: "View your dashboard"
  - Description: "See live data and start tracking health."
  - CTA: "Go to Dashboard"

### Dashboard Empty State
- Tile title: "Events (7d)"
  - Message: "No events yet. Connect a source to start seeing data."
- Tile title: "Errors (7d)"
  - Message: "No errors yet. Connect a source to start tracking health."

### Dashboard With Data
- Tile title: "Events (7d)"
  - Message: "Showing total events for the past 7 days."
- Tile title: "Errors (7d)"
  - Message: "Showing total errors for the past 7 days."

### Sources Page
- Empty state message: "No sources connected. Add one to bring PRISM to life."
- Button: "Connect new source"

## Asana Quick Tasks (PRISM v0.1)

| Task Name | Description | Assignee Email | Section | Due Date |
| --- | --- | --- | --- | --- |
| Wireframes | Generate Figma wireframes with prompts for Sign-in, Onboarding, Dashboard, Sources. | amundsonalexa@gmail.com | Today | 2025-10-14 |
| Copy deck | Add copy deck text to Notion + Figma; link to PRISM repo. | amundsonalexa@gmail.com | Today | 2025-10-14 |
| Review workshop | Run 30-min review of wireframes + copy with team; lock by EOW. | amundsonalexa@gmail.com | This Week | 2025-10-16 |

## Slack Post ( #products-prism )

```
UX track started:
- Figma wireframe prompts prepped (Sign-in, Onboarding, Dashboard, Sources)
- Copy deck for onboarding + empty states
- Asana tasks added; review session scheduled

Aim: wireframes + copy locked by Thursday → dev can stub screens in PRISM console immediately.
```

## Next Decision

Let me know whether to keep pushing on user onboarding polish (email template HTML + Slack SSO flow) or pivot back to infrastructure work on preview environments for PRs.

