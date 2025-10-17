---
title: "Pruned Bitcoin Core: the 60-second setup"
date: "2024-05-27"
tags: [bitcoin, infrastructure, guides]
description: "Enable pruning in Bitcoin Core to fully-validate the chain on tiny disks without running out of space."
---

Here’s a quick, practical way to run Bitcoin Core on very little disk space by enabling pruning—you still fully validate the chain, but old block files are discarded to save space.

---

## What pruning does

Pruning keeps your node honest *and* lightweight. Every block and transaction is validated, but once they have been checked the old block and undo files are deleted so they do not consume storage. You keep the UTXO set plus a handful of the most recent blocks, which is all you need to operate a fully validating node.

### Trade-offs to keep in mind

- You cannot run `txindex=1` alongside pruning.
- You cannot serve very old blocks to peers or wallets that request deep history.
- Wallets continue to function normally, including HD wallets. Rescans still work, but they can take longer and may require a temporary re-download window.

---

## Step 1 — Edit `bitcoin.conf`

Locations by platform:

- Linux: `~/.bitcoin/bitcoin.conf`
- Raspberry Pi: `/home/pi/.bitcoin/bitcoin.conf`
- Windows: `%APPDATA%\Bitcoin\bitcoin.conf`
- macOS: `~/Library/Application Support/Bitcoin/bitcoin.conf`

Add (or change) the following lines:

```ini
# Disk target for block/undo data in MiB (e.g., 2200 ≈ ~2.2 GiB)
prune=2200

# Make sure txindex is OFF when pruning
txindex=0
```

Pick a prune size that fits your device:

- `prune=550` (~0.55 GiB, absolute minimum)
- `prune=2200` (~2.2 GiB, a good balance)
- `prune=10000` (~10 GiB, comfortable for rescans)

---

## Step 2 — Restart Bitcoin Core

- If Bitcoin Core was running with `txindex=1`, stop it, set `txindex=0`, and restart.
- The first start after enabling pruning may delete old block files and shrink disk usage gradually as it progresses.

---

## Step 3 — Verify pruning is active

Use the CLI and `jq` to confirm:

```bash
bitcoin-cli getblockchaininfo | jq '{pruned, pruneheight, size_on_disk, blocks, headers}'
```

Look for `"pruned": true` and a reasonable `pruneheight`.

---

## Step 4 — Wallet and rescan notes

- Normal sends and receives work as usual.
- Historical rescans beyond your prune window may require downloading some blocks again; Core handles this automatically when it can.
- If you import very old keys, consider temporarily increasing the prune target (or running unpruned) to speed up deep rescans.

---

## Step 5 — Stay tidy on tiny disks

- Put the data directory on your biggest drive (for example `-datadir=/mnt/ssd/bitcoin` or `datadir=/mnt/ssd/bitcoin` in `bitcoin.conf`).
- Keep `dbcache` modest on machines with limited RAM (around `dbcache=300–600`).
- Back up wallet files (`wallet.dat` or descriptor wallets) regularly; pruning does not change wallet safety.

---

Need sizing advice? Tell me how much free space you have and I can suggest a prune size and `dbcache` combo that keeps sync reliable on your hardware.
