# e-Sign

- `POST /api/clm/esign/send` `{ contractId, recipients:[{name,email,role}] }`
- `POST /api/clm/esign/callback` `{ provider, payload }`
- `GET  /api/clm/esign/status/:contractId`
