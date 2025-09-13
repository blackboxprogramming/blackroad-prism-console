from __future__ import annotations

import argparse
import json
import subprocess

from policy import loader
from security import crypto
from scripts import gen_docs
from orchestrator import metrics


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('command')
    parser.add_argument('--name')
    args = parser.parse_args()

    cmd = args.command
    if cmd == 'policy:list':
        for p in sorted(loader.PACKS_DIR.glob('*.yaml')):
            pack = loader.load_pack(p.stem)
            print(f"{pack.name}\t{pack.version}")
    elif cmd == 'policy:apply':
        if not args.name:
            parser.error('--name required')
        pack = loader.load_pack(args.name)
        loader.apply_pack(pack)
        print(f"applied {pack.name}")
    elif cmd == 'crypto:keygen':
        kid = crypto.generate_key()
        print(kid)
    elif cmd == 'crypto:status':
        st = crypto.status()
        print(json.dumps(st))
    elif cmd == 'crypto:rotate':
        crypto.rotate_key()
        count = crypto.rotate_data()
        metrics.inc(metrics.crypto_rotate)
        print(count)
    elif cmd == 'docs:generate':
        gen_docs.main()
        metrics.inc(metrics.docs_built)
    elif cmd == 'docs:build':
        subprocess.run(['mkdocs', 'build'], check=True)
        metrics.inc(metrics.docs_built)
    else:
        parser.error('unknown command')


if __name__ == '__main__':
    main()
