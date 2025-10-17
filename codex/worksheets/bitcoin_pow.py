"""Bitcoin proof-of-work worksheet for Codex agents.

Each step in this module corresponds to a test block in
``tests/test_bitcoin_pow_worksheet.py``.  Fill in the implementations
sequentially and run ``pytest tests/test_bitcoin_pow_worksheet.py`` after
finishing each step to see new assertions unlock.

Steps
-----
1. Bits ↔ target ↔ difficulty conversions.
2. Block header serialization and hashing helpers.
3. Merkle root construction for block templates.
4. Mining probability utilities for shares and timing.
5. Difficulty retarget window math.

Endianness, compact-format rounding, and Decimal precision all matter
here—pay close attention to the docstrings for required behaviour.
"""

from __future__ import annotations

from decimal import Decimal, getcontext

getcontext().prec = 50

T1 = int("00000000FFFF0000000000000000000000000000000000000000000000000000", 16)
"""Difficulty-1 target for Bitcoin mainnet."""

TWO_256 = Decimal(2) ** 256
"""Convenience constant for probability math."""

TARGET_TIMESPAN = 2016 * 600
"""Retarget interval in seconds (two weeks)."""

__all__ = [
    "T1",
    "TWO_256",
    "TARGET_TIMESPAN",
    "bits_to_target",
    "target_to_bits",
    "target_to_difficulty",
    "difficulty_to_target",
    "le_hex_to_bytes",
    "dsha256",
    "serialize_header",
    "header_hash",
    "is_valid_pow",
    "merkle_root",
    "success_prob_per_hash",
    "expected_hashes",
    "expected_time_seconds",
    "is_share_valid",
    "clamp_retarget_timespan",
    "compute_retarget",
]


def bits_to_target(nbits: int) -> int:
    """Step 1A – convert compact ``nBits`` to an integer target.

    * Extract the exponent (most significant byte) and the 3-byte coefficient.
    * For ``E >= 3`` multiply the coefficient by ``2 ** (8 * (E - 3))``.
    * For ``E < 3`` right-shift the coefficient by ``8 * (3 - E)`` bits.
    * Ignore the sign bit—``nBits`` is assumed positive for valid headers.
    """

    raise NotImplementedError("Step 1A: bits_to_target")


def target_to_bits(target: int) -> int:
    """Step 1B – encode a target back into Bitcoin's compact format.

    Requirements
    ------------
    * Strip leading zero bytes from the big-endian representation.
    * If the most-significant byte is ``>= 0x80``, prepend a zero byte and
      bump the exponent.
    * The coefficient must be exactly three bytes, left padded with zeros if
      needed.
    * Return ``(exponent << 24) | coefficient``.
    """

    raise NotImplementedError("Step 1B: target_to_bits")


def target_to_difficulty(target: int) -> Decimal:
    """Step 1C – convert a target into human-readable difficulty."""

    raise NotImplementedError("Step 1C: target_to_difficulty")


def difficulty_to_target(difficulty: Decimal) -> int:
    """Step 1D – invert :func:`target_to_difficulty` using ``Decimal`` math."""

    raise NotImplementedError("Step 1D: difficulty_to_target")


def le_hex_to_bytes(hex_string: str) -> bytes:
    """Step 2A – convert big-endian display hex into little-endian bytes."""

    raise NotImplementedError("Step 2A: le_hex_to_bytes")


def dsha256(payload: bytes) -> bytes:
    """Step 2B – return ``SHA256(SHA256(payload))`` bytes."""

    raise NotImplementedError("Step 2B: dsha256")


def serialize_header(
    version: int,
    prev_block_hex: str,
    merkle_root_hex: str,
    timestamp: int,
    nbits: int,
    nonce: int,
) -> bytes:
    """Step 2C – serialize a block header into 80 little-endian bytes."""

    raise NotImplementedError("Step 2C: serialize_header")


def header_hash(
    version: int,
    prev_block_hex: str,
    merkle_root_hex: str,
    timestamp: int,
    nbits: int,
    nonce: int,
) -> tuple[int, str]:
    """Step 2D – compute the double-SHA256 hash and big-endian hex digest."""

    raise NotImplementedError("Step 2D: header_hash")


def is_valid_pow(hash_value: int, target: int) -> bool:
    """Step 2E – return ``True`` when ``hash_value <= target``."""

    raise NotImplementedError("Step 2E: is_valid_pow")


def merkle_root(txids_hex: list[str]) -> tuple[str, str]:
    """Step 3 – build a Merkle root from transaction IDs.

    The first element of the tuple is the big-endian hex string for display.
    The second element is the little-endian hex string for header insertion.
    Duplicate the final hash on odd levels.
    """

    raise NotImplementedError("Step 3: merkle_root")


def success_prob_per_hash(target: int) -> Decimal:
    """Step 4A – approximate ``target / 2**256`` as a :class:`Decimal`."""

    raise NotImplementedError("Step 4A: success_prob_per_hash")


def expected_hashes(target: int) -> Decimal:
    """Step 4B – return the expected number of hashes for success."""

    raise NotImplementedError("Step 4B: expected_hashes")


def expected_time_seconds(target: int, hashrate_hs: Decimal) -> Decimal:
    """Step 4C – expected seconds to solve a block at ``hashrate_hs``."""

    raise NotImplementedError("Step 4C: expected_time_seconds")


def is_share_valid(hash_value: int, share_target: int) -> bool:
    """Step 4D – helper for pool share validation checks."""

    raise NotImplementedError("Step 4D: is_share_valid")


def clamp_retarget_timespan(actual_timespan: int, target_timespan: int = TARGET_TIMESPAN) -> int:
    """Step 5A – clamp the observed timespan by Bitcoin's 4× bounds."""

    raise NotImplementedError("Step 5A: clamp_retarget_timespan")


def compute_retarget(
    old_target: int,
    first_timestamp: int,
    last_timestamp: int,
    target_timespan: int = TARGET_TIMESPAN,
) -> tuple[int, int]:
    """Step 5B – compute the next target and compact bits after retarget."""

    raise NotImplementedError("Step 5B: compute_retarget")
