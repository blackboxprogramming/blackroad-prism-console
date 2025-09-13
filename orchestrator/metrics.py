from collections import Counter

_counters: Counter[str] = Counter()


def inc(name: str) -> None:
    _counters[name] += 1


def get(name: str) -> int:
    return _counters.get(name, 0)


policy_applied = 'policy_applied'
crypto_rotate = 'crypto_rotate'
docs_built = 'docs_built'
janitor_purge = 'janitor_purge'
