#!/usr/bin/env python3
import csv
import datetime as dt
import json
import os
from pathlib import Path

VENDOR_FILE = Path("governance/soc2/vendor-database.csv")
REMINDER_WINDOWS = {7, 30}
TODAY = dt.date.today()

messages = []

if VENDOR_FILE.exists():
    with VENDOR_FILE.open() as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            renewal_str = row.get("Renewal", "").strip()
            if not renewal_str:
                continue
            try:
                renewal_date = dt.datetime.strptime(renewal_str, "%Y-%m-%d").date()
            except ValueError:
                continue
            delta = (renewal_date - TODAY).days
            if delta in REMINDER_WINDOWS:
                messages.append(
                    {
                        "vendor": row.get("Vendor", "Unknown"),
                        "days": delta,
                        "owner": row.get("Owner", "Unassigned"),
                        "risk": row.get("Risk", ""),
                        "dpa": row.get("DPA link", ""),
                        "security": row.get("Security (SOC2/ISO link)", ""),
                    }
                )

output = {
    "generated_at": TODAY.isoformat(),
    "messages": messages,
}

print(json.dumps(output))
