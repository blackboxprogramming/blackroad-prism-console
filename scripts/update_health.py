#!/usr/bin/env python3
"""Generate `api/health.json` with build metadata.

The script captures the current commit and a UTC timestamp so deployments can
expose a simple health document. It writes the JSON file to `api/health.json`
relative to the repository root.
"""

import json
import pathlib
import subprocess
import time

def main():
    repo_root = pathlib.Path(__file__).resolve().parent.parent

    # Record the exact commit of the working tree and a UTC timestamp.
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode().strip()
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    data = {
        'status': 'ok',
        'app': 'quantum-v3',
        'version': 'v3.0.0',
        'commit': commit,
        'ts': ts,
    }
    path = repo_root / 'api' / 'health.json'
    path.write_text(json.dumps(data, indent=2) + '\n')
    print(f'Wrote health data to {path}')

if __name__ == '__main__':
    main()
