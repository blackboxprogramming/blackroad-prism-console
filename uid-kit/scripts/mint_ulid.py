#!/usr/bin/env python3
"""Print a freshly minted ULID."""

from __future__ import annotations

import sys

try:
    from ulid import ULID  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback when ulid package missing
    import datetime as _dt
    import secrets as _secrets

    def _fallback_ulid() -> str:
        """Generate a lexicographically sortable ULID-like identifier.

        This does not guarantee full ULID compatibility but preserves
        monotonic ordering and randomness characteristics close enough for
        local scripting when the `ulid` package is unavailable.
        """

        timestamp = int(_dt.datetime.utcnow().timestamp() * 1000)
        time_component = timestamp.to_bytes(6, byteorder="big", signed=False)
        randomness = _secrets.token_bytes(10)
        crockford32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
        data = time_component + randomness
        encoded = []
        for i in range(0, len(data), 5):
            chunk = int.from_bytes(data[i : i + 5].ljust(5, b"\x00"), "big")
            for shift in range(35, -5, -5):
                encoded.append(crockford32[(chunk >> shift) & 0x1F])
        return "".join(encoded)[:26]

    def mint() -> str:
        return _fallback_ulid()
else:
    def mint() -> str:
        return str(ULID())


if __name__ == "__main__":
    uid = mint()
    sys.stdout.write(f"{uid}\n")
