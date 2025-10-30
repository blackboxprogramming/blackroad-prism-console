import string

import pytest

from analysis.rohonc_decoder import RohoncDecoder, parse_symbol_stream


def test_symbol_space_and_theta():
    decoder = RohoncDecoder()
    assert decoder.total_space == 300
    assert decoder.symbol_space == 150
    assert pytest.approx(decoder.theta, rel=1e-6) == 256 / 150


def test_rotation_sequence_with_reset():
    decoder = RohoncDecoder()
    sequence = decoder.rotation_sequence(6, resets={3})
    # First three positions follow the incremental rotation,
    # reset at index 3 restarts the progression.
    assert sequence == [0, 1, 3, 0, 1, 3]


def test_encode_decode_round_trip_with_resets():
    decoder = RohoncDecoder()
    plaintext = [0, 149, 57, 88, 32, 149]
    resets = {3}
    encoded = decoder.encode_sequence(plaintext, resets=resets)
    recovered = decoder.decode_sequence(encoded, resets=resets)
    assert recovered == plaintext


def test_decode_to_text_uses_custom_alphabet():
    decoder = RohoncDecoder()
    # Build a synthetic alphabet of 150 characters using ascii letters and digits.
    alphabet = list((string.ascii_letters + string.digits + string.punctuation) * 3)
    alphabet = alphabet[: decoder.symbol_space]
    encoded = decoder.encode_sequence([0, 1, 2, 3])
    decoded_text = decoder.decode_to_text(encoded, alphabet)
    assert decoded_text == "".join(alphabet[i] for i in range(4))


def test_parse_symbol_stream_handles_varied_whitespace():
    payload = "1 2\n3\t4  5"
    assert parse_symbol_stream(payload) == [1, 2, 3, 4, 5]


def test_parse_symbol_stream_rejects_invalid_tokens():
    with pytest.raises(ValueError):
        parse_symbol_stream("1 two 3")
