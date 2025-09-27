from __future__ import annotations

from decimal import Decimal

import pytest

from codex.worksheets import bitcoin_pow as bp


def call_or_skip(func, *args, **kwargs):
    try:
        return func(*args, **kwargs)
    except NotImplementedError as exc:  # pragma: no cover - skip helper
        pytest.skip(str(exc))


class TestStep1DifficultyMath:
    def test_bits_to_target_genesis(self):
        target = call_or_skip(bp.bits_to_target, 0x1D00FFFF)
        assert target == bp.T1

    def test_bits_to_target_small_exponent(self):
        target = call_or_skip(bp.bits_to_target, 0x01123456)
        assert target == 0x12

    def test_target_to_bits_round_trip(self):
        target = call_or_skip(bp.bits_to_target, 0x05009234)
        bits = call_or_skip(bp.target_to_bits, target)
        assert bits == 0x05009234

    def test_target_to_bits_handles_high_bit(self):
        bits = call_or_skip(bp.target_to_bits, 0x12)
        assert bits == 0x01120000

    def test_difficulty_conversions(self):
        target = call_or_skip(bp.bits_to_target, 0x1B0404CB)
        diff = call_or_skip(bp.target_to_difficulty, target)
        expected = Decimal(bp.T1) / Decimal(target)
        assert diff == expected

        rebuilt_target = call_or_skip(bp.difficulty_to_target, Decimal("2"))
        assert rebuilt_target == int(Decimal(bp.T1) / Decimal(2))


class TestStep2HeaderHashing:
    def test_le_hex_to_bytes_roundtrip(self):
        payload = call_or_skip(bp.le_hex_to_bytes, "aabbccdd")
        assert payload == bytes.fromhex("ddccbbaa")

    def test_dsha256(self):
        digest = call_or_skip(bp.dsha256, b"bitcoin")
        assert digest.hex() == (
            "f1ef1bf105d788352c052453b15a913403be59b90ddf9f7c1f937edee8938dc5"
        )

    def test_serialize_and_hash_genesis(self):
        header = call_or_skip(
            bp.serialize_header,
            1,
            "00" * 32,
            "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
            1231006505,
            0x1D00FFFF,
            2083236893,
        )
        assert len(header) == 80
        assert header[:4] == (1).to_bytes(4, "little")

        hash_int, hash_hex = call_or_skip(
            bp.header_hash,
            1,
            "00" * 32,
            "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
            1231006505,
            0x1D00FFFF,
            2083236893,
        )
        assert hash_hex == "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
        assert hash_int == 10628944869218562084050143519444549580389464591454674019345556079
        assert call_or_skip(bp.is_valid_pow, hash_int, bp.T1) is True


class TestStep3MerkleRoots:
    def test_merkle_root_three_transactions(self):
        txids = [
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        ]
        root_be, root_le = call_or_skip(bp.merkle_root, txids)
        assert root_be == "1946e9d4a203723d7d7464f5d158c3f411c7ba5c82014d97342e447f8326f2d6"
        assert root_le == "d6f226837f442e34974d01825cbac711f4c358d1f564747d3d7203a2d4e94619"

    def test_merkle_root_empty(self):
        root_be, root_le = call_or_skip(bp.merkle_root, [])
        assert root_be == "00" * 32
        assert root_le == "00" * 32


class TestStep4Probability:
    def test_success_probability(self):
        target = bp.T1 // 2
        prob = call_or_skip(bp.success_prob_per_hash, target)
        expected = Decimal(target) / bp.TWO_256
        assert prob == expected

    def test_expected_hashes_and_time(self):
        target = bp.T1 // 1024
        hashes = call_or_skip(bp.expected_hashes, target)
        expected_hashes = Decimal(1) / (Decimal(target) / bp.TWO_256)
        assert hashes == expected_hashes

        seconds = call_or_skip(bp.expected_time_seconds, target, Decimal("1e12"))
        assert seconds == expected_hashes / Decimal("1e12")

    def test_share_validation(self):
        assert call_or_skip(bp.is_share_valid, 10, 100) is True
        assert call_or_skip(bp.is_share_valid, 200, 100) is False


class TestStep5Retarget:
    def test_clamp_timespan(self):
        assert call_or_skip(bp.clamp_retarget_timespan, bp.TARGET_TIMESPAN) == bp.TARGET_TIMESPAN
        assert call_or_skip(bp.clamp_retarget_timespan, bp.TARGET_TIMESPAN // 10) == (
            bp.TARGET_TIMESPAN // 4
        )
        assert call_or_skip(bp.clamp_retarget_timespan, bp.TARGET_TIMESPAN * 10) == (
            bp.TARGET_TIMESPAN * 4
        )

    def test_compute_retarget(self):
        old_target = bp.T1 // 1024
        base = 1_000_000

        new_target, new_bits = call_or_skip(
            bp.compute_retarget,
            old_target,
            base,
            base + bp.TARGET_TIMESPAN // 2,
        )
        assert new_target == 13163835591314115963455310715197261394536571649694416057684459520
        assert new_bits == 0x1B1FFFE0

        slow_target, slow_bits = call_or_skip(
            bp.compute_retarget,
            old_target,
            base,
            base + bp.TARGET_TIMESPAN * 2,
        )
        assert slow_target == 52655342365256463853821242860789045578146286598777664230737838080
        assert slow_bits == 0x1B7FFF80

        fast_target, fast_bits = call_or_skip(
            bp.compute_retarget,
            old_target,
            base,
            base + bp.TARGET_TIMESPAN // 10,
        )
        assert fast_target == 6581917795657057981727655357598630697268285824847208028842229760
        assert fast_bits == 0x1B0FFFF0
