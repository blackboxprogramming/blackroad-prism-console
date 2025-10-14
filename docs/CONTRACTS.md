# Contracts

- `POST /api/clm/contracts/create` `{ contractId, templateKey, counterparty, effective?, term_months?, fields:{} }`
- `POST /api/clm/contracts/attach` `{ contractId, fileRef, kind }`
- `POST /api/clm/contracts/redline` `{ contractId, version, author, diff_md }`
- `GET  /api/clm/contracts/:contractId`
