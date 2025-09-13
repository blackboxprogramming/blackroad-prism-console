# Human-in-the-Loop Reviews

The HITL queue allows compliance reviewers to approve or request changes for tasks.

Commands:

- `python -m cli.console hitl:enqueue --task T100 --type security --artifact artifacts/T100/response.json --reviewers U_SEC,U_CTO`
- `python -m cli.console hitl:list --status pending`
- `python -m cli.console hitl:approve --id H001 --reviewer U_SEC --note "Reviewed"`
