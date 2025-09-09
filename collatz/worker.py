import argparse
import os
from typing import Tuple

import psutil
import yaml

from .db import claim_job, connect, finish_job, record_anomaly


# Fast integer Collatz step with power-of-two compression
def collatz_step(n: int) -> int:
    if n % 2 == 0:
        return n // 2
    # 3n+1 then compress factors of 2
    n = 3 * n + 1
    # remove all trailing zeros in binary (i.e., divide by 2^k)
    return n >> (
        (n & -n).bit_length() - 1
    )  # bit trick: count trailing zeros via bit_length of lowbit


def stopping_time_and_excursion(n0: int, max_steps: int = 10_000_000) -> Tuple[int, int]:
    n = n0
    max_exc = n
    steps = 0
    while n != 1 and steps < max_steps:
        n = collatz_step(n)
        if n > max_exc:
            max_exc = n
        steps += 1
    if n != 1:
        return -1, max_exc  # anomaly (didn't reach 1 within cap)
    return steps, max_exc


def verify_second_pass(n0: int) -> bool:
    # Different schedule: classic per-step without compression, but still safe.
    n = n0
    seen_steps = 0
    while n != 1 and seen_steps < 20_000_000:
        if n % 2 == 0:
            n //= 2
        else:
            n = 3 * n + 1
        seen_steps += 1
    return n == 1


def run_job(db_path: str, artifact_dir: str, job_id: int, s: int, e: int, verify: bool):
    os.makedirs(artifact_dir, exist_ok=True)
    conn = connect(db_path)
    checked = 0
    max_stop = 0
    max_exc = 0
    for n0 in range(s, e + 1):
        st, exc = stopping_time_and_excursion(n0)
        if st < 0:
            # anomaly: didn't converge within cap
            trace_path = os.path.join(artifact_dir, f"anomaly_trace_{n0}.txt")
            with open(trace_path, "w") as f:
                n = n0
                for _ in range(1_000_000):
                    f.write(str(n) + "\n")
                    if n == 1:
                        break
                    n = 3 * n + 1 if n & 1 else n // 2
            record_anomaly(conn, n0, "no_convergence_cap", job_id, trace_path)
        else:
            if st > max_stop:
                max_stop = st
            if exc > max_exc:
                max_exc = exc
            if verify and not verify_second_pass(n0):
                record_anomaly(conn, n0, "verify_mismatch", job_id, None)
            checked += 1
    finish_job(conn, job_id, 1 if verify else 0, s, e, max_stop, max_exc, checked)


def worker_loop(db_path: str, artifact_dir: str, verify: bool):
    conn = connect(db_path)
    while True:
        slot = claim_job(conn)
        if not slot:
            break
        job_id, s, e = slot
        run_job(db_path, artifact_dir, job_id, s, e, verify)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="./campaign.sqlite")
    ap.add_argument("--cfg", default="./collatz/config.yaml")
    ap.add_argument("--workers", type=int, default=max(1, psutil.cpu_count(logical=False) or 1))
    args = ap.parse_args()
    cfg = yaml.safe_load(open(args.cfg))
    artifact_dir = cfg["artifact_dir"]
    verify = bool(cfg.get("verify_pass", True))

    # Simple local worker loop
    import multiprocessing as mp

    with mp.Pool(processes=args.workers) as pool:
        pool.starmap(worker_loop, [(args.db, artifact_dir, verify)] * args.workers)


if __name__ == "__main__":
    main()
