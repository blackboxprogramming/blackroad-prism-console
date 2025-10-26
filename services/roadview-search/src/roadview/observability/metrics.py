from __future__ import annotations

from prometheus_client import Counter, Histogram

search_requests_total = Counter(
    "roadview_search_requests_total",
    "Total search requests processed",
    ["status"],
)

search_duration_seconds = Histogram(
    "roadview_search_duration_seconds",
    "Search request duration",
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5),
)

index_docs_total = Counter(
    "roadview_index_docs_total",
    "Total documents ingested",
)

domains_total = Counter(
    "roadview_domains_total",
    "Total domains managed",
)
