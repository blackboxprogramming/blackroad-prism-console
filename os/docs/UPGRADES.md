# Upgrades & Rollbacks

## How it works
- Releases are **git tags** like `v0.4.0`.
- Channel:
  - `stable` (default) picks latest *pure semver* tag (vX.Y.Z).
  - `edge` picks the latest tag, including `-rc`/`-beta`.
- Upgrade:
  - Records current tag as **last-good**.
  - Checks out the latest by channel.
  - Rebuilds & restarts the stack.
  - Runs health gate (`os/tests/smoke.sh`).
  - Rolls back automatically if the gate fails.

## Commands
- Show current version:
```

brctl version

```
- Switch channel:
```

brctl channel stable
brctl channel edge

```
- Upgrade to latest:
```

brctl upgrade

```
- Rollback to last-good:
```

brctl rollback

```

## Tagging releases (from your dev machine)
```

git tag v0.4.0
git push origin v0.4.0

```
Optionally create pre-releases like `v0.5.0-rc.1` for the `edge` channel.

## Notes
- Default path builds images locally; if you later publish images, we can switch to `compose pull` for faster OTA.
- Health gate uses `os/tests/smoke.sh`. Add routes or stricter checks as needed.
