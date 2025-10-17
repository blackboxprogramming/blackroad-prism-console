---
title: "Weekend Bitcoin Core Descriptor Backups"
date: "2025-02-14"
tags: [bitcoin, self-custody, ops]
description: "Automate encrypted descriptor exports so Bitcoin Core rebuilds never endanger your wallets."
---

Keeping a Bitcoin Core wallet healthy on a Raspberry Pi gets easier when descriptor exports are part of the weekend routine. Descriptors are the reproducible blueprint of a wallet—derivation paths, scripts, and extended public keys—which means a fresh node can rebuild addresses and rescan funds without exposing seeds.

## 1. Export descriptors on the node Pi

Ensure the wallet you want to protect is loaded, then export it with private fields included. Replace `<WALLET>` with the wallet name you use on the node (supply `-rpcwallet=<name>` if the wallet is not the default one):

```bash
bitcoin-cli listdescriptors true > ~/btc_descriptors_<WALLET>_$(date -I).json
```

Set the final boolean to `false` if you want an xpub-only dump instead of private descriptors.

## 2. Encrypt the export with a symmetric key

Encrypting the JSON before it leaves the node prevents a stolen backup file from leaking private paths. Generate your passphrase on a different Raspberry Pi (or another offline system) and store it there with root-only permissions.

### Option A — `age`

```bash
age -p -o ~/btc_descriptors_<WALLET>_$(date -I).json.age ~/btc_descriptors_<WALLET>_*.json
shred -u ~/btc_descriptors_<WALLET>_*.json
```

### Option B — `gpg`

```bash
gpg --symmetric --cipher-algo AES256 \
  -o ~/btc_descriptors_<WALLET>_$(date -I).json.gpg \
  ~/btc_descriptors_<WALLET>_*.json
shred -u ~/btc_descriptors_<WALLET>_*.json
```

Both commands remove the plaintext file once encryption succeeds.

## 3. Send the encrypted file to a backup Pi

Copy the encrypted payload to a second Raspberry Pi so the passphrase and the backup never coexist on the node:

```bash
scp ~/btc_descriptors_<WALLET>_*.age alexa@<backup-pi>:/home/alexa/secure/
# or
scp ~/btc_descriptors_<WALLET>_*.gpg alexa@<backup-pi>:/home/alexa/secure/
```

Keep the passphrase file rooted on the backup machine (`chmod 600`) or store it entirely offline.

## 4. Restore after a rebuild or migration

When it is time to rebuild the node, decrypt the descriptor set and import it into a fresh wallet before rescanning the chain.

1. Decrypt on the new node:

   ```bash
   # age
   age -d -o /tmp/descriptors.json /path/to/btc_descriptors_<WALLET>.json.age
   # gpg
gpg -o /tmp/descriptors.json -d /path/to/btc_descriptors_<WALLET>.json.gpg
   ```

2. Create a descriptor wallet and import the JSON (leave private keys enabled so the wallet can sign after the restore):

   ```bash
   bitcoin-cli createwallet "<WALLET>" false true "" false true
   bitcoin-cli -rpcwallet="<WALLET>" importdescriptors "$(cat /tmp/descriptors.json)"
   ```

3. Rescan the chain, optionally bounding the start height or timestamp for faster recovery:

   ```bash
   bitcoin-cli -rpcwallet="<WALLET>" rescanblockchain <start_height_or_timestamp>
   ```

## 5. Notes for Ledger and Ledger Flex users

- Watch-only wallets derived from Ledger xpubs only export public descriptors, so an encrypted backup is still safe to store remotely. Spending still requires the hardware device.
- If you are mirroring multiple Ledger Flex accounts, export and label each descriptor set separately (e.g., `m/84'/0'/0'` for bech32, `m/86'/0'/0'` for taproot).

## 6. Hardening tips

- `chmod 600` the descriptor file before encryption and `shred -u` the plaintext afterward.
- Keep the passphrase on the backup Pi under `~/keys/btc_desc_pass.txt` with `chmod 600`, and never copy it back to the node.
- Automate the ritual with a weekly cron job on the node. For example:

  ```bash
  crontab -e
  # Every Saturday 02:30 — export, encrypt, ship (adjust paths and tools as needed)
  30 2 * * 6 bitcoin-cli listdescriptors true > /tmp/desc.json && \
    age -p -o /tmp/desc.json.age /tmp/desc.json && shred -u /tmp/desc.json && \
    scp /tmp/desc.json.age alexa@<backup-pi>:/home/alexa/secure/ && shred -u /tmp/desc.json.age
  ```

Need bespoke wallet names, hostnames, or a preferred encryption tool? Drop the details and we can generate a ready-to-run script.
