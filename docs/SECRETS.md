# Secrets Management

BlackRoad uses [SOPS](https://github.com/getsops/sops) with [age](https://age-encryption.org/) keys to protect sensitive configuration.

## Encrypting

Run `scripts/encrypt_secret.sh` to generate an age key (if missing) and encrypt the local `.env` file to `.env.enc`.
Commit only the encrypted `.env.enc` file; never commit the raw `.env`.

## Decrypting

Export `SOPS_AGE_KEY_FILE=secrets/age.key` and run:

```bash
sops -d .env.enc > .env
```

## Compliance

The deployment workflow verifies that `.env.enc` exists and contains SOPS metadata before running. This enforces that secrets are encrypted prior to deployment.

These safeguards align with BlackRoad's governance strategy: strong secrets hygiene enables focus, clear trade-offs, and an auditable activity fit for enterprise environments.
