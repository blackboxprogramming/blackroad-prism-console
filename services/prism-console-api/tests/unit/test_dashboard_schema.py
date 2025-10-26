from prism.schemas.dashboard import DashboardPayload, DashboardStatus, Metric, Shortcut


def test_dashboard_payload_serialization() -> None:
    payload = DashboardPayload(
        summary="All systems nominal",
        metrics=[
            Metric(
                id="uptime",
                title="Uptime",
                value="99.9%",
                caption="24h",
                icon="activity",
                status=DashboardStatus.good,
            )
        ],
        shortcuts=[
            Shortcut(id="runbooks", title="Runbooks", icon="book", url="https://example.com/runbooks")
        ],
    )

    assert payload.metrics[0].status is DashboardStatus.good
    assert str(payload.shortcuts[0].url).endswith("runbooks")
