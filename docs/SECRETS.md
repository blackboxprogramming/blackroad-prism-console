# Secrets and Address Verification Checklist

This guide documents the steps to confirm that repository files, GitHub Actions workflows, and the Raspberry Pi agent are configured to guard wallet addresses while running on Node.js 20.

## Address secret naming (top-15 coverage)

Use one secret per address. Stick to uppercase `SNAKE_CASE` names so the values stay organized across repositories and agents.

```text
# EVM / ERC-20 family (0x…): ETH, USDT, USDC, BNB (BSC), MATIC (Polygon), AVAX (C-chain), LINK, GRT, etc.
ETH_ADDRESS
USDT_ETH_ADDRESS
USDC_ETH_ADDRESS
BNB_BSC_ADDRESS
MATIC_POLYGON_ADDRESS
AVAX_C_ADDRESS
LINK_ETH_ADDRESS

# Bitcoin-family
BTC_ADDRESS
LTC_ADDRESS
DOGE_ADDRESS
BCH_ADDRESS

# Solana / Ton
SOL_ADDRESS
TON_ADDRESS

# Cosmos / Polkadot / XRP / TRX / ADA
ATOM_ADDRESS
DOT_ADDRESS
XRP_ADDRESS
TRX_ADDRESS
ADA_ADDRESS
```

> Many existing secrets (for example, `ROBINHOOD_ETHEREUM`, `COINBASE_BITCOIN`, `VENMO_LITECOIN`) already map to specific custodians or wallets. Keep those in place; the generic names above are for future repositories and agents that need consistent naming.

## 1. Confirm required files are present

In each repository (for example `blackroad-prism-console` or `lucidia`), verify that the following paths exist:

- `.github/workflows/reusable-node20.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/addresses-digests.yml`
- `.github/actions/inject-secrets/action.yml`
- `tools/addresses.ts`
- `src/config/addresses.ts`
- `agent/index.ts`
- `agent/tsconfig.json`
- `agent/systemd/agent.service`
- `tsconfig.json`
- `docs/secrets.md`

**GitHub UI:** open the repository → Code tab → press `/` to launch the file finder, paste each path, and confirm the file renders.

## 2. Ensure GitHub Actions runs Node.js 20

1. Trigger the reusable workflow (`Actions` → **CI • Node 20**) or push a trivial commit.
2. Open a job (for example, `lint`). Confirm the setup step shows:

   ```text
   Setup Node 20 (actions/setup-node@v4)
   with:
     node-version: 20.x
   ```

3. Look for `node -v` output (for example, `v20.x.y`).

GitHub encrypts secrets with libsodium sealed boxes before they reach GitHub and only decrypts them for explicitly authorized jobs. See the GitHub Actions **Secrets** documentation (search for “Libsodium sealed boxes”).

## 3. Sanity-check masked secrets output

1. Run the **Addresses • Digests only** workflow from the `Actions` tab.
2. Provide a comma-separated list of secret names (for example, `ROBINHOOD_ETHEREUM,ROBINHOOD_BITCOIN,COINBASE_BITCOIN,VENMO_LITECOIN`).
3. Confirm the workflow emits a table with columns `NAME`, `LEN`, `MASKED`, and `DIGEST8`, showing only masked tails and digest hashes.

## 4. Validate the Raspberry Pi agent

On the device:

```bash
npm ci || npm i
npm run build:agent
npm run start:agent
# Or enable the systemd unit:
# sudo systemctl status agent
```

From a Tailscale-connected client (adjust the IP/port if needed):

```bash
curl http://100.66.235.47:8080/healthz
curl http://100.66.235.47:8080/addresses
```

Expect `healthz` to return JSON similar to `{"ok":true,"node":"v20.x.y"}`, and `addresses` to print the masked digest table with no raw secrets.

## 5. Optional: repository guardrail

Add a guard step to `.github/workflows/ci.yml`:

```yaml
  guardrails:
    uses: ./.github/workflows/reusable-node20.yml
    with:
      run: >-
        node -e "for (const k of Object.keys(process.env))
        if (k.includes('SECRET')) {
          console.log('secret present:', k);
        }"
```

The snippet only prints environment variable names containing `SECRET`, helping detect unintended secret exposure.

## 6. Monitor secret hygiene in the UI

Navigate to **Settings → Secrets and variables → Actions** in each repository. Verify that wallet secret names (for example, `ROBINHOOD_ETHEREUM`, `COINBASE_BITCOIN`, `VENMO_LITECOIN`) are present with recent update timestamps. GitHub never reveals stored values; only users with repository access can see the names.

