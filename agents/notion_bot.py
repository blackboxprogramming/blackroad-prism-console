"""Simple Notion bot for interacting with a shared to-do list page.

The bot connects to the Notion API using a token provided via the
``NOTION_API_KEY`` environment variable.  It exposes helper methods to list and
add to-do items on a page.  By default it targets the page from the invite link
(`26d31cc065b380c3a54ce1db10cea24e`) but this can be overridden with the
``NOTION_PAGE_ID`` environment variable.
"""

from __future__ import annotations

import os
from typing import List

from notion_client import Client


class NotionBot:
    """A tiny helper class for interacting with a Notion to-do list."""

    def __init__(self, token: str, page_id: str) -> None:
        self.client = Client(auth=token)
        self.page_id = page_id

    def list_tasks(self) -> List[str]:
        """Return the unchecked to-do items on the page."""
        children = self.client.blocks.children.list(self.page_id).get("results", [])
        tasks: List[str] = []
        for child in children:
            if child["type"] == "to_do" and not child["to_do"].get("checked", False):
                rich = child["to_do"].get("rich_text", [])
                if rich:
                    tasks.append(rich[0]["plain_text"])
        return tasks

    def add_task(self, text: str) -> None:
        """Append a new unchecked task to the page."""
        self.client.blocks.children.append(
            self.page_id,
            children=[
                {
                    "object": "block",
                    "type": "to_do",
                    "to_do": {
                        "rich_text": [{"type": "text", "text": {"content": text}}],
                        "checked": False,
                    },
                }
            ],
        )


def _default_page_id() -> str:
    return os.environ.get("NOTION_PAGE_ID", "26d31cc065b380c3a54ce1db10cea24e")


def main() -> None:
    token = os.environ.get("NOTION_API_KEY")
    if not token:
        print("NOTION_API_KEY not set; skipping Notion interaction.")
        return
    bot = NotionBot(token, _default_page_id())
    print("Current tasks:")
    for task in bot.list_tasks():
        print(f"- {task}")


if __name__ == "__main__":
    main()
