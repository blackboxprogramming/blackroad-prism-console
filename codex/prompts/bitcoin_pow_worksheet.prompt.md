# Bitcoin Proof-of-Work Worksheet

Goal: implement the staged helpers in `codex/worksheets/bitcoin_pow.py` and
unlock the assertions in `tests/test_bitcoin_pow_worksheet.py`.

## How to use
1. Work through each step in order—the pytest file skips later sections until
the corresponding functions stop raising `NotImplementedError`.
2. After completing a step, run:
   ```bash
   pytest tests/test_bitcoin_pow_worksheet.py
   ```
   Watch for the next block of tests to activate.
3. Keep the reference formulas from the worksheet header close by; every step
highlights a common endianness or rounding pitfall.

## Step breakdown
1. **Compact difficulty math** — convert between `nBits`, full targets, and
difficulty values using `Decimal` precision.
2. **Header hashing** — serialize the 80-byte header correctly and confirm the
hash against mainnet block 0.
3. **Merkle trees** — rebuild the root with proper little-endian ordering and
odd-node duplication.
4. **Mining probability** — compute share probabilities, expected hashes, and
run-time estimates.
5. **Retarget windows** — clamp the observed timespan, derive the new target,
and produce the compact `nBits` encoding.

SegWit commitments and extranonce handling are outside the scope of this
worksheet but make great follow-up explorations once the basics are passing.
