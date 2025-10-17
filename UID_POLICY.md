# How We Use UIDs

Universal work identifiers (UIDs) are the spine that connects every artifact our teams create. A single ULID travels from intake through delivery so automation can join data using exact keys instead of fuzzy heuristics.

## Principles

1. **One UID per work item** – Mint a ULID the moment an idea enters intake and reuse it everywhere.
2. **Every artifact references the UID** – Issues, branches, commits, PRs, docs, designs, builds, and tickets must include the UID in a machine-readable field.
3. **Automation relies on joins** – Dashboards, bots, and analytics only depend on `uid` equality, never on titles or URLs.

## Operational flow

1. **Intake** – Create a `work_item` row with the ULID, title, type, and status. Insert a matching ticket in your tracker with the UID stored in a required custom field.
2. **Execution** – Use the UID in branch names (`feat/<UID>-summary`), commit trailers (`UID: <UID>`), PR titles (`[<UID>] ...`), and PR bodies.
3. **Documentation** – Prefix doc and design titles with `[<UID>]` and add `UID: <UID>` to metadata blocks or the first line of the document.
4. **Automation** – Export `WORK_UID=<UID>` in CI/CD so builds, test reports, SBOMs, and runbooks embed the identifier.
5. **Link tracking** – Write `work_link` rows whenever you create an artifact, capturing `uid`, `kind`, `provider`, `external_id`, and `url`.

## Guardrails

- **Hooks** – Enable the provided `commit-msg` hook and reject commits that lack a matching `UID:` trailer once `uid.lock` is set.
- **Templates** – Use PR templates that make the UID explicit and add bots that fill labels or comments automatically.
- **CI checks** – Fail pipelines that omit `WORK_UID` so releases and reports cannot ship without traceability.
- **Backfill and freeze** – Assign UIDs to historical work, load the relationships into `work_link`, then block new artifacts that do not cite a UID.

## Why it matters

- **Zero guesswork** – Bots know exactly which PR, ticket, or document belongs together.
- **Instant rollups** – A single query can gather code, docs, tests, incidents, and runs for any work item.
- **Rename-proof** – Titles, repos, and URLs can change without breaking the relationships.

Adhering to this policy keeps our automation reliable and audits painless. One key ties everything together.
