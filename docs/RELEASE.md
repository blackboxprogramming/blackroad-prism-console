# Release Checklist

1. **Branch clean:** All CI green; `CHANGELOG.md` updated under [Unreleased].
2. **Version bump:** `make release-minor` (or patch/major) → commit + tag.
3. **Push tags:** `git push --follow-tags`.
4. **CI release:** Wait for tag workflow to publish GitHub Release and `public/artifacts.sha256`.
5. **Website:** Vercel picks latest main; confirm `/artifacts` renders hash and downloads.
6. **Post:** Move [Unreleased] notes to the new version section with date.

