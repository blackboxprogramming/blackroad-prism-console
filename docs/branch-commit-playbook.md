# Branch & Commit Playbook

This guide documents the branch naming, commit messaging, and PR workflow conventions shared in the latest DevX rollout. Use it whenever you cut new work so that automation (labels, title guards, reviewer routing) stays green.

## Branch Naming

```
<area>/<short-scope>-<2-4 words>
```

**Areas**: `feat`, `fix`, `chore`, `docs`, `ops`, `perf`, `test`.

Examples:
- `feat/prism-onboarding-welcome-checklist`
- `feat/creator-upload-gallery`
- `feat/payouts-stripe-test`

## Commit Message Format

Follow Conventional Commits plus an intent emoji so automations can map titles to labels.

```
<emoji> <type>(optional-scope): short, imperative summary

Body (optional): what + why. Links. Screens/metrics.

Refs: Closes #<issue>, Relates-to #<issue>
```

**Types**: `feat | fix | chore | docs | refactor | test | perf | build | ci | revert`

**Emoji intent**

| Emoji | Use |
| --- | --- |
| ✨ | feature / enhancement |
| 🐛 | bug fix |
| 🧰 | maintenance / chore |
| 📚 | documentation |
| ⚙️ | operations |
| 🧪 | tests |
| 📦 | dependency updates |
| 💸 | payouts / payments |

### Ready-to-use commit subjects

#### Onboarding shell
- `✨ feat(prism-onboarding): welcome + checklist shell`
- `📚 docs(prism): add onboarding copy + empty states`
- `🧰 chore(analytics): emit PRISM Checklist Completed`

#### Creator upload & gallery
- `✨ feat(creator): upload form + /api/v1/uploads`
- `✨ feat(creator): gallery view + status tiles`
- `🧰 chore(balances): mock 0.01/view ticker`

#### Payout (Stripe)
- `💸 feat(payouts): claim button + test PaymentIntent`
- `⚙️ ops(slack): post "First Payout" to #asteria-loop`
- `🧰 chore(payouts): idempotent retries on webhook`

## Opening Pull Requests

Create PRs promptly with informative titles. With GitHub CLI:

```bash
# Onboarding
git checkout -b feat/prism-onboarding-welcome-checklist
# ...code...
git commit -m "✨ feat(prism-onboarding): welcome + checklist shell"
git push -u origin HEAD
gh pr create --fill \
  --title "✨ feat(prism-onboarding): welcome + checklist shell" \
  --body-file .github/pull_request_template.md

# Creator upload + gallery
git checkout -b feat/creator-upload-gallery
git commit -m "🧰 feat(creator): upload form, gallery view, mock balance"
git push -u origin HEAD
gh pr create --title "🧰 feat(creator): upload form, gallery view, mock balance" --fill

# Payout
git checkout -b feat/payouts-stripe-test
git commit -m "💸 feat(payouts): Stripe test-mode claim + Slack alert"
git push -u origin HEAD
gh pr create --title "💸 feat(payouts): Stripe test-mode claim + Slack alert" --fill
```

> The repository's PR template already defines **Summary**, **Testing**, and **Linked Issues** sections, so `--fill` keeps reviewer checklists consistent.

### Issue Links

At the end of each PR body add:

```
Closes #<issue-number>
```

For the current roadmap:

```
Closes #1  # onboarding shell
Closes #2  # creator upload + gallery
Closes #3  # payout flow
```

## Reviewer Routing Tips

- Include a short scope after the type: `feat(prism-onboarding)`, `feat(creator)`, `feat(payouts)`.
- Keep the emoji prefix so workflows can auto-apply labels and satisfy title guards.

## Next Steps

If you want to enforce these conventions with branch protection (e.g., require the title guard and tests before squash merges), run the `make_pr` assistant request: "Share branch protection rules for this playbook".
