# GitHub Actions Secrets Quick Start

Keep all custodial wallet addresses and API credentials inside GitHub Actions Secrets. GitHub encrypts the values with libsodium sealed boxes on submit and only decrypts them for authorized workflows at runtime.

## Recommended secret names

Use uppercase keys with underscores to stay consistent across repositories:

- `ROBINHOOD_ETHEREUM`
- `ROBINHOOD_BITCOIN`
- `ROBINHOOD_LITECOIN`
- `COINBASE_BITCOIN`
- `COINBASE_LITECOIN`
- `COINBASE_ETHEREUM`
- `COINBASE_NEAR`
- `COINBASE_GRT`
- `COINBASE_MLN`
- `COINBASE_VECHAIN`
- `COINBASE_POLYGON`
- `VENMO_BITCOIN`
- `VENMO_ETHEREUM`
- `VENMO_CHAINLINK`
- `VENMO_PAYPALUSD`

Add new keys as additional services come online.

## Adding secrets

1. Navigate to **Settings → Secrets and variables → Actions** in your repository or organization.
2. Click **New repository secret**.
3. Enter the name from the list above and paste the address or credential value.
4. Save the secret. GitHub will mask the value in logs and only expose it to jobs with explicit access.

> _Placeholder for screenshots of the secrets UI_

## Usage reminders

- Never commit plaintext addresses or API keys.
- Use the reusable Node 20 workflow and `inject-secrets` composite action to expose secrets only for the steps that need them.
- When logging, print masked values and SHA-256 digests only.
