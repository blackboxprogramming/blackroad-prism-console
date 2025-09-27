# Bitcoin Proof-of-Work Prompt Pack

This reference collects the essential equations and Codex-ready prompts needed to validate Bitcoin proof-of-work headers, compute Merkle roots, evaluate difficulty changes, and reason about mining shares. Every prompt is designed to run entirely in memory—**no files, no network access, print results only.**

## 1. Core Equations

- **Block header (80 bytes)**
  \\
  $\text{header} = \text{ver} \|\| \text{prev\_block} \|\| \text{merkle\_root} \|\| \text{time} \|\| \text{nBits} \|\| \text{nonce}$
  
  Serialize each field in little-endian order. Explorers display hashes in big-endian.
- **Block hash (double SHA-256)**
  \\
  $H = \operatorname{int}_{\text{big}}\left( \operatorname{SHA256}(\operatorname{SHA256}(\text{header\_bytes})) \right)$
- **Target from compact `nBits`**
  \\
  Let $E = \text{nBits} \gg 24$ and $\text{coeff} = \text{nBits} \&\; 0x007fffff$. Then
  \\
  $T = \begin{cases}
  \text{coeff} \cdot 2^{8(E-3)} & E \ge 3 \\\\
  \left\lfloor \dfrac{\text{coeff}}{2^{8(3-E)}} \right\rfloor & E < 3
  \end{cases}$
- **Validity**
  \\
  $H \le T$
- **Difficulty**
  \\
  $D = \dfrac{T_1}{T}, \quad T_1 = \texttt{0x00000000FFFF\ldots0000}$ (mainnet difficulty-1 target)
- **Success probability per hash**
  \\
  $p \approx \dfrac{T}{2^{256}}$
- **Expected hashes and time** (with hashrate $R$ hashes/s)
  \\
  $\mathbb{E}[\text{hashes}] \approx \dfrac{2^{256}}{T}, \quad \mathbb{E}[t] \approx \dfrac{2^{256}}{R\,T}$
- **Share vs. network target**
  \\
  Share valid if $H \le T_{\text{share}}$; block valid if $H \le T_{\text{network}}$ where typically $T_{\text{share}} \ge T_{\text{network}}$.
- **Chain work**
  \\
  $\text{work} = \left\lfloor \dfrac{2^{256}-1}{T+1} \right\rfloor \approx \dfrac{2^{256}}{T+1}$

## 2. Merkle Root Construction

- Each transaction ID (txid) is the double-SHA256 of the raw transaction, displayed big-endian.
- When building the tree, feed txids as little-endian bytes. At each level, pair $a, b$ (duplicate the last hash if the level has odd length) and compute $\text{dSHA256}(a \|\| b)$.
- The header stores the Merkle root in little-endian. User interfaces typically display the big-endian representation.

## 3. Difficulty Retarget (2016-block epochs)

Let $t_{\text{actual}} = t_{\text{last}} - t_{\text{first}}$ and $t_{\text{target}} = 2016 \times 600 = 1{,}209{,}600$ seconds. Clamp $t_{\text{actual}}$ to $[t_{\text{target}}/4,\;4\,t_{\text{target}}]$. Then compute

$T_{\text{new}} = T_{\text{old}} \cdot \dfrac{t_{\text{actual}}}{t_{\text{target}}}$

Finally, convert $T_{\text{new}}$ back to compact `nBits` using Bitcoin Core rounding, managing overflow and the sign bit.

## 4. Endianness Cheat-Sheet

- All six header fields serialize in little-endian.
- `prev_block` and `merkle_root` are displayed big-endian; reverse them before serializing into the header.
- Displayed hashes (including txids) are big-endian hex; the raw digest bytes are little-endian when interpreted in Bitcoin headers.

## 5. Codex-Ready Prompts (Print-Only)

Replace placeholders like `{{...}}` before execution. Each prompt instructs the model to print results only—no file writes, no network calls.

### (A) Bits ↔ Target ↔ Difficulty

Implement in-memory helpers:

```text
1) bits_to_target(nbits:int)->int using Bitcoin compact encoding.
2) target_to_bits(target:int)->int (match Core rounding; manage overflow/sign bit).
3) target_to_difficulty(target:int)->decimal using difficulty-1 target T1 (mainnet).
4) difficulty_to_target(D:decimal)->int.
```

Print:
- target hex and int for `nBits={{NBITS}}`
- difficulty
- round-trip `target_to_bits(bits_to_target({{NBITS}}))`

No file writes.

### (B) Header Hash & Validity

Serialize a Bitcoin header:

```text
version={{VER}}
prev_block={{PREV_BE_HEX}}
merkle_root={{MERKLE_BE_HEX}}
time={{TIME}}
nBits={{NBITS}}
nonce={{NONCE}}
```

- Convert `prev_block` and `merkle_root` from big-endian display to little-endian bytes.
- Produce the 80-byte header (all fields little-endian).
- Double-SHA256 the header to obtain $H$ (big-endian integer).
- Compute the target $T$ from `nBits`.

Print:
- header hex
- block hash (big-endian hex)
- boolean result for $H \le T$
- numeric $H$ and $T$

### (C) Merkle Root from Txids

Given txids (big-endian hex): `{{TXID_LIST}}`

- Convert each txid to little-endian bytes.
- Pairwise double-SHA256, duplicating the final hash if needed.
- Continue until a single root remains.

Print both representations:
- `merkle_root_header_LE` (hex)
- `merkle_root_display_BE` (hex)

### (D) Probability, Expected Time, Shares

Implement:

```text
success_prob_per_hash(target:int) ≈ T / 2^256
expected_hashes(target:int) ≈ 2^256 / T
expected_time_seconds(target:int, R:decimal) = expected_hashes / R
is_share_valid(H:int, share_target:int) -> bool
```

Use inputs:
- `nBits={{NBITS}}`
- `hashrate R={{HASHRATE_HS}}` hashes/s
- candidate hash integer `H={{H_INT}}`
- share target from `bits={{SHARE_BITS}}`

Print:
- `p`
- `expected_hashes`
- `expected_time_seconds`
- `share_valid`

### (E) Difficulty Retarget

Given:
- `old nBits={{OLD_NBITS}}`
- `first_ts={{FIRST_TS}}`
- `last_ts={{LAST_TS}}`
- `target_timespan = 2016 * 600`

Steps:
1. Compute `actual_timespan = last_ts - first_ts` and clamp to `[target_timespan/4, 4 * target_timespan]`.
2. Convert `old nBits` to $T_{\text{old}}$.
3. Compute $T_{\text{new}} = T_{\text{old}} \cdot actual / target_timespan$.
4. Convert $T_{\text{new}}$ back to compact `nBits`.

Print:
- `actual_timespan` (after clamping)
- `T_old` (hex)
- `T_new` (hex)
- `nBits_new` (hex and int)

### (F) Chain Work & Cumulative Work

For `nBits` values: `{{NBITS_LIST}}`

- Convert each `nBits_i` to target $T_i$.
- Compute `work_i = floor((2^256 - 1) / (T_i + 1))`.
- Track the running sum `cumulative_work`.

Print `work_i` for each block (decimal) and `cumulative_work`.

### (G) Coinbase Extranonce & Merkle Root

With a fixed txid list whose first entry is the coinbase:

- Treat the coinbase txid as variable.
- Replace it with `{{NEW_COINBASE_TXID_BE}}` and rebuild the Merkle root.

Print:
- original root (`LE` for header, `BE` for display)
- updated root (same formats)
- a short note describing the change.

## 6. Optional Extensions

- Compute SegWit witness commitments by hashing the wtxid Merkle root and embedding the result in the coinbase `OP_RETURN 0xaa21a9ed...` commitment.
- Explore compact encoding edge cases to mirror Bitcoin Core rounding for borderline targets.
- Replay historical headers to validate proof-of-work and cumulative chainwork selection.

## 7. Common Pitfalls

- Always reverse `prev_block` and `merkle_root` when serializing headers.
- Displayed hash strings are big-endian; the header expects little-endian fields.
- Respect compact encoding rules, especially when the leading byte would set the sign bit.
- Difficulty retargets clamp the actual timespan by a factor of four.
- Mining pools evaluate shares with a higher (easier) target than the network target.

