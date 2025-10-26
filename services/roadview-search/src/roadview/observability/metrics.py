from __future__ import annotations

from prometheus_client import Counter, Histogram

REQUESTS_TOTAL = Counter(
    "roadview_search_requests_total",
    "Total number of search requests",
    labelnames=("status",),
)

REQUEST_DURATION = Histogram(
    "roadview_search_duration_seconds",
    "Search request duration",
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5),
)

INDEX_DOCS_TOTAL = Counter(
    "roadview_index_docs_total",
    "Number of documents indexed",
)

DOMAINS_TOTAL = Counter(
    "roadview_domains_total",
    "Number of domains managed",
)
