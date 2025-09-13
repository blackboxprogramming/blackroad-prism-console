# SOP Checklists

Checklists enforce required steps before releases or other gated processes.

```
python -m cli.console sop:new --name release --from sop/templates/release.yaml
python -m cli.console sop:attest --id C001 --actor U_PM --note "Backups verified"
python -m cli.console sop:status --name release
```
