#!/usr/bin/env python3
import json, subprocess, time, pathlib

def main():
    repo_root = pathlib.Path(__file__).resolve().parent.parent
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip()
    ts = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
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
