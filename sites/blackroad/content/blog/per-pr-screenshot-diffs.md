---
title: "Per-PR Screenshot Diffs"
date: "2025-08-17"
tags: [visual-diffs, qa]
description: "Automated per-PR screenshot comparisons catch visual regressions before merging."
---

BlackRoad.io now generates per-PR screenshot diffs to spot UI changes early.
When a pull request touches the site, a workflow captures images from the base
branch and the proposed changes, then reports a mismatch percentage and a diff
image back on the PR.

Developers get instant visual feedback while ChatOps commands keep caches warm
and snapshots fresh.
