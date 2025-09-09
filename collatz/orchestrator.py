import argparse
import time

import yaml

from .db import connect, enqueue_chunks, status


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=int, required=True)
    ap.add_argument("--end", type=int, required=True)
    ap.add_argument("--chunk", type=int, default=None)
    ap.add_argument("--db", default="./campaign.sqlite")
    ap.add_argument("--cfg", default="./collatz/config.yaml")
    ap.add_argument("--workers", type=int, default=0, help="optional hint for humans/logs only")
    args = ap.parse_args()

    cfg = yaml.safe_load(open(args.cfg))
    db = connect(args.db)
    chunk = args.chunk or int(cfg["chunk_size"])

    enqueue_chunks(db, args.start, args.end, chunk)
    print(f"Enqueued [{args.start}, {args.end}] in chunks of {chunk}.")
    print("Run workers on each device: `python -m collatz.worker --db ./campaign.sqlite`")
    print("Status will refresh every ~10s.\n")

    while True:
        q, r, d = status(db)
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] queued={q} running={r} done={d}")
        if q == 0 and r == 0:
            print("All jobs complete.")
            break
        time.sleep(10)


if __name__ == "__main__":
    main()
