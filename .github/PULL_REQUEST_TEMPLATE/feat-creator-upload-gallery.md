---
name: "🧰 feat: creator upload + gallery"
about: "Adds upload, publish, and gallery flow for creators"
title: "🧰 feat: creator upload + gallery"
labels:
  - "type/feature"
  - "status/ready-for-review"
---

## Summary
- Adds minimal upload form, gallery listing, and mock RoadCoin balance counter.

## Testing
- Upload → file appears in gallery.
- Balance increases 0.01 per view.
- Refresh does not return 404.
about: "Adds the Cadillac Loop upload form, gallery view, and mock balance ticker."
title: "🧰 feat: creator upload + gallery"
labels:
  - "type/feature"
  - "prio/normal"
---

## Summary
- Build upload form wired to `/api/v1/uploads`
- Render uploaded entries in a gallery with refresh-safe routing
- Display mock RoadCoin balance that increments by 0.01 per view

## Testing
- [ ] Upload a file and verify it appears in the gallery
- [ ] Confirm the balance increases by 0.01 for each view event
- [ ] Refresh the gallery page and confirm it loads without a 404

## Linked Issues
Closes #2
