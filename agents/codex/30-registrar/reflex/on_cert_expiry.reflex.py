"""Certificate expiry reflex."""
from __future__ import annotations

from datetime import date

from ..pipelines import cert_watch

try:
    from lucidia.reflex.core import BUS, start
except Exception:  # pragma: no cover
    BUS = None

    def start() -> None:  # pragma: no cover
        raise RuntimeError("lucidia reflex bus not available")


CERT_STORE: dict[str, dict[str, str]] = {}


@BUS.on("cert:check") if BUS else (lambda func: func)
def renew_if_needed(event: dict) -> None:
    domain = event.get("domain")
    if not domain:
        return
    store_entry = CERT_STORE.setdefault(
        domain,
        {"domain": domain, "expires_on": event.get("expires_on", date.today().isoformat()), "fingerprint": event.get("fingerprint", "")},
    )
    result = cert_watch.renew(domain, CERT_STORE, today=date.today())
    if result.get("renewed"):
        if BUS:
            BUS.emit("registrar:cert.renewed", {"domain": domain, "fp": result["fingerprint"]})
            BUS.emit("audit:evidence.created", {"receipt": result["receipt"]})
        else:
            print(f"certificate renewed for {domain}: {result['fingerprint']}")


if __name__ == "__main__":  # pragma: no cover
    if BUS:
        start()
    else:
        renew_if_needed({"domain": "example.com", "expires_on": date.today().isoformat(), "fingerprint": "abc"})
