---
name: "feat: creator upload + gallery"
about: "Implement the upload → publish → gallery loop for testers"
title: "feat: creator upload + gallery"
labels: ["type/feature", "status/planned"]
assignees: ["Copilot", "Cecilia"]
---

## Problem
No visible upload → publish → gallery flow for testers.

## Solution
Add upload form, gallery view, and mock balance ticker. Wire the flow to `/api/v1/uploads` and ensure optimistic UI during submission.

## Notes
- Assign @Copilot for API coverage and @Cecilia for UI polish.
- Surface a mock RoadCoin balance ticker that updates with gallery views.
- Confirm the new endpoints are reflected in integration docs.
