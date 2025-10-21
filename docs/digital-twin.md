# Digital Twin

The Digital Twin modules provide offline and deterministic tooling for
checkpointing, replaying, stressing and comparing runs.

## Checkpoint / Restore

```bash
python -m cli.console twin:checkpoint --name demo
python -m cli.console twin:list
python -m cli.console twin:restore --name demo
The Digital Twin modules provide deterministic, offline tooling.

## Checkpoints

```
python -m cli.console twin:checkpoint --name snap1
python -m cli.console twin:list
python -m cli.console twin:restore --name snap1
```

## Replay

```bash
python -m cli.console twin:replay --from "2025-01-01" --to "2025-01-02" --mode verify
python -m cli.console twin:replay --window last_24h --mode diff
```

## Stress Profiles

```bash
python -m cli.console twin:stress --profile default --duration 60
```

## Side-by-side Compare

```bash
python -m cli.console twin:compare --left artifacts/runA --right artifacts/runB
```
python -m cli.console twin:replay --from "2025-01-01" --to "2025-01-02" --mode verify
python -m cli.console twin:replay --window last_24h --filter bot=SRE-BOT --mode diff
```

## Stress

```
python -m cli.console twin:stress --profile default --duration 60
```

## Compare

```
python -m cli.console twin:compare --left artifacts/bench/A --right artifacts/bench/B
```

## Safety

These commands operate on local files only. Restores will warn when the
`READ_ONLY` or `DRY_RUN` environment variables are set.
These commands honor offline mode; avoid running when `READ_ONLY` or `DRY_RUN` are set.
