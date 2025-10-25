"""Main orchestration for syncing external service connectors."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

from dotenv import load_dotenv

from .connectors.asana import AsanaConnector
from .connectors.base import ConnectorBase, ConnectorResult
from .connectors.canva import CanvaConnector
from .connectors.clickup import ClickUpConnector
from .connectors.dropbox import DropboxConnector
from .connectors.figma import FigmaConnector
from .connectors.github import GitHubConnector
from .connectors.hubspot import HubSpotConnector
from .connectors.linear import LinearConnector
from .connectors.notion import NotionConnector
from .connectors.slack import SlackConnector


@dataclass
class SummaryRow:
    service: str
    status: str
    account: str
    projects: str
    details: str


def build_connectors() -> List[ConnectorBase]:
    """Instantiate all connectors."""
    return [
        GitHubConnector(),
        LinearConnector(),
        AsanaConnector(),
        NotionConnector(),
        SlackConnector(),
        DropboxConnector(),
        FigmaConnector(),
        CanvaConnector(),
        HubSpotConnector(),
        ClickUpConnector(),
    ]


def render_table(rows: Iterable[SummaryRow]) -> str:
    """Render a plain-text table for the given rows."""
    headers = [
        "Service",
        "Status",
        "Account / Workspace",
        "Active Projects / Teams",
        "Details",
    ]
    data_rows = [
        [row.service, row.status, row.account, row.projects, row.details]
        for row in rows
    ]
    if not data_rows:
        data_rows.append(["-", "-", "-", "-", "-"])

    widths = [
        max(len(headers[idx]), *(len(row[idx]) for row in data_rows))
        for idx in range(len(headers))
    ]

    def format_line(values: Iterable[str]) -> str:
        return "| " + " | ".join(
            value.ljust(widths[idx]) for idx, value in enumerate(values)
        ) + " |"

    divider = "+" + "+".join("-" * (width + 2) for width in widths) + "+"
    table_lines = [divider, format_line(headers), divider]
    for row in data_rows:
        table_lines.append(format_line(row))
    table_lines.append(divider)
    return "\n".join(table_lines)


def summarize(results: Iterable[ConnectorResult]) -> List[SummaryRow]:
    summary: List[SummaryRow] = []
    for result in results:
        status_icon = "✅" if result.success else "❌"
        status = f"{status_icon} {result.status_message}"
        account = result.account_name or "—"
        projects = (
            str(result.active_projects) if result.active_projects is not None else "—"
        )
        details = result.error_message or ""
        summary.append(
            SummaryRow(
                service=result.service_name,
                status=status,
                account=account,
                projects=projects,
                details=details,
            )
        )
    return summary


def run() -> None:
    """Load environment, execute each connector, and print results."""
    load_dotenv()
    results: List[ConnectorResult] = []
    for connector in build_connectors():
        print(f"Checking {connector.name}...")
        result = connector.sync()
        results.append(result)
        if result.success:
            print(
                f"  Connected to {result.account_name or 'unknown account'}: "
                f"{result.active_projects or 0} active projects/teams"
            )
        else:
            print(f"  Failed: {result.error_message}")
    print()
    summary_rows = summarize(results)
    print(render_table(summary_rows))


__all__ = ["run"]
