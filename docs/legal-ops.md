# Legal Ops & Contracts

This module provides a lightweight, fully offline contract lifecycle manager.

## Workflow
1. Create a contract: `python -m cli.console legal:contract:new --type MSA --counterparty "Acme Ltd."`
2. Assemble clauses into a draft: `python -m cli.console legal:assemble --template MSA --options configs/legal/options/acme.yml --out artifacts/legal/C001_v1.md`
3. Route and approve: `python -m cli.console legal:approve:request --id C001 --for-role CFO` then `python -m cli.console legal:contract:approve --id C001 --as-user U_CFO`
4. Sign and execute once approvals are complete: `python -m cli.console legal:esign --id C001 --user U_CFO --text "Approve C001"` followed by `python -m cli.console legal:contract:execute --id C001 --date 2025-10-01`
5. Extract obligations: `python -m cli.console legal:obligations:extract --id C001`
6. Build compliance calendar: `python -m cli.console legal:calendar:build`

All events are stored under `artifacts/legal` for audit purposes.
