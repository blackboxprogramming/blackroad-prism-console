"""
Setup Instructions:
1. Install dependencies: ``pip install -r requirements.txt``.
2. Create a ``.env`` file (optionally by copying an existing example) and populate tokens such as ``GITHUB_TOKEN``, ``LINEAR_API_KEY``, ``ASANA_ACCESS_TOKEN``, ``NOTION_TOKEN``, ``SLACK_BOT_TOKEN``, ``DROPBOX_ACCESS_TOKEN``, ``FIGMA_ACCESS_TOKEN``, ``FIGMA_TEAM_ID``, ``CANVA_API_TOKEN``, ``HUBSPOT_ACCESS_TOKEN``, and ``CLICKUP_API_TOKEN``.
3. Run the sync tool: ``python sync_connectors.py``.

This script loads API credentials from the environment, connects to each service, and
prints a summary table describing connection status and project counts.
"""

from sync_connectors.main import run


if __name__ == "__main__":
    run()
