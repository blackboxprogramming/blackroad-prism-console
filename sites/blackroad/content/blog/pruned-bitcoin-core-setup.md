---
title: "Pruned Bitcoin Core: 60-Second Disk-Saving Setup"
date: "2025-02-15"
tags: [bitcoin, infrastructure, guides]
description: "Enable pruning in Bitcoin Core to keep full validation on tiny disks without storing the entire chain."
---

Running a validating Bitcoin Core node does not require hundreds of gigabytes if you enable pruning. The node still verifies every block and transaction, but it discards historical block files once they are no longer needed, keeping only the UTXO set and a rolling window of recent blocks. That trade keeps the chain state trustworthy while trimming storage footprints to just a few gigabytes.

## Understand the pruning trade-offs

Pruning is ideal for Raspberry Pis, VPS tiers with modest SSDs, and any host where disk space is precious. A few limitations to keep in mind:

- `txindex=1` is incompatible with pruning. Leave `txindex` disabled unless you upgrade to an unpruned node later.
- Peers that request ancient blocks or some legacy wallets needing deep history cannot fetch data from a pruned node.
- Wallet rescans still work, but importing very old keys may trigger re-downloads within the prune window and take longer to complete.

## Step 1 — Edit `bitcoin.conf`

Locate your configuration file, usually at:

- Linux: `~/.bitcoin/bitcoin.conf`
- Raspberry Pi: `/home/pi/.bitcoin/bitcoin.conf`
- Windows: `%APPDATA%\Bitcoin\bitcoin.conf`
- macOS: `~/Library/Application Support/Bitcoin/bitcoin.conf`

Add (or update) the following settings:

```ini
# Disk target for block/undo data in MiB (e.g., 2200 ≈ ~2.2 GiB)
prune=2200

# Make sure txindex is OFF when pruning
txindex=0
```

Pick a prune target that fits your hardware:

- `prune=550` (~0.55 GiB) — bare minimum storage.
- `prune=2200` (~2.2 GiB) — balanced for Pis and small SSDs.
- `prune=10000` (~10 GiB) — roomy enough for faster rescans.

## Step 2 — Restart Bitcoin Core

Restart the daemon or desktop app after saving `bitcoin.conf`. If you previously ran with `txindex=1`, stop the node, set `txindex=0`, and start again. The first run after enabling pruning will gradually delete old block files until the disk usage matches your target.

## Step 3 — Confirm pruning status

Use the CLI to verify that pruning is active:

```bash
bitcoin-cli getblockchaininfo | jq '{pruned, pruneheight, size_on_disk, blocks, headers}'
```

Look for `"pruned": true` along with a reasonable `pruneheight` that tracks how many historical blocks are retained.

## Wallet and rescan considerations

- Everyday wallet operations—receiving, sending, and descriptor wallets—work normally on a pruned node.
- Deep rescans may require temporarily downloading older blocks inside your prune window. Bitcoin Core handles that automatically when possible.
- Importing very old keys? Consider increasing the prune target or running unpruned temporarily to accelerate the catch-up.

## Extra care for tiny disks

- Point `datadir` to the largest attached drive (for example, `datadir=/mnt/ssd/bitcoin` or start the daemon with `-datadir=/mnt/ssd/bitcoin`).
- Keep `dbcache` conservative on low-RAM systems; 300–600 MiB works well on Raspberry Pis.
- Back up your wallets (`wallet.dat` or descriptor files) regularly. Pruning never touches wallet data, but good backups are still essential.

Pick a prune size that fits your free space, restart, and you are running a fully validating Bitcoin node without the bulk storage requirements.
