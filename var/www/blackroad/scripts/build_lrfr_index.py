#!/usr/bin/env python3
"""
Scans /var/www/blackroad/data/requests/*.json and writes index.json.
Skips schema.json and index.json itself.
"""

import glob
import json
import os

REQ_DIR = "/var/www/blackroad/data/requests"
INDEX = os.path.join(REQ_DIR, "index.json")


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    items = []
    for path in glob.glob(os.path.join(REQ_DIR, "*.json")):
        base = os.path.basename(path)
        if base in ("schema.json", "index.json"):
            continue
        try:
            o = load(path)
            # Minimal card data for the UI index
            items.append(
                {
                    "id": o.get("id"),
                    "title": o.get("title"),
                    "summary": o.get("summary"),
                    "agent": o.get("agent"),
                    "status": o.get("status"),
                    "tags": o.get("tags", []),
                    "difficulty": o.get("difficulty"),
                    "bounty": o.get("bounty", {}),
                    "owner": o.get("owner", {}),
                    "created_at": o.get("created_at"),
                    "updated_at": o.get("updated_at"),
                }
            )
        except Exception as e:
            print(f"skip {base}: {e}")
    items.sort(key=lambda x: x.get("updated_at") or x.get("created_at") or "", reverse=True)
    out = {"version": "2025-08-18", "count": len(items), "items": items}
    with open(INDEX, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {INDEX} with {len(items)} items")


if __name__ == "__main__":
    main()
