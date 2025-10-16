#!/usr/bin/env python3
# FILE: pi_compute.py
# Usage examples:
#   python3 pi_compute.py --digits 2000                  # Chudnovsky (default)
#   python3 pi_compute.py --digits 2000 --method chud
#   python3 pi_compute.py --digits 2000 --method gauss
#   python3 pi_compute.py --terms 2_000_000 --method leibniz
#   python3 pi_compute.py --samples 50_000_000 --method montecarlo
#   python3 pi_compute.py --digits 5000 --out pi.txt
#   python3 pi_compute.py --digits 5000 --workers 4 --progress

import argparse
import concurrent.futures
import math
import random
import sys
import time
from decimal import Decimal, getcontext

# --- Known prefix of pi for quick verification (50 digits)
PI_PREFIX = "3.14159265358979323846264338327950288419716939937510"


def _init_worker(prec: int) -> None:
    getcontext().prec = prec


def _chudnovsky_term(k: int) -> Decimal:
    """Compute k-th term of Chudnovsky series."""
    numerator = Decimal(math.factorial(6 * k)) * (13591409 + 545140134 * k)
    denominator = (
        Decimal(math.factorial(3 * k))
        * (math.factorial(k) ** 3)
        * (Decimal(640320) ** (3 * k))
    )
    term = numerator / denominator
    return -term if (k % 2) else term


def _print_progress(step: int, total: int) -> None:
    width = 40
    filled = int(width * step / total)
    bar = "#" * filled + "-" * (width - filled)
    sys.stdout.write(f"\r[{bar}] {step}/{total}")
    if step == total:
        sys.stdout.write("\n")
    sys.stdout.flush()


def chudnovsky_pi(digits: int, workers: int = 1, progress: bool = False) -> str:
    """
    Compute pi using the Chudnovsky series (rapid convergence).
    digits: number of decimal digits desired.
    workers: number of parallel workers (processes) to use.
    progress: display a simple progress bar.
    Returns decimal string with requested digits.
    """
    prec = digits + 10
    getcontext().prec = prec

    C = 426880 * Decimal(10005).sqrt()
    n_terms = max(1, int(digits / 14.181647) + 1)

    if workers > 1:
        S = Decimal(0)
        with concurrent.futures.ProcessPoolExecutor(
            max_workers=workers, initializer=_init_worker, initargs=(prec,)
        ) as ex:
            tasks = ex.map(_chudnovsky_term, range(n_terms))
            for i, term in enumerate(tasks, 1):
                S += term
                if progress:
                    _print_progress(i, n_terms)
    else:
        # Sequential iterative method
        M = Decimal(1)
        L = Decimal(13591409)
        X = Decimal(1)
        K = 6
        S = L
        if progress:
            _print_progress(1, n_terms)
        for k in range(1, n_terms):
            M = (M * (K ** 3 - 16 * K)) / (k ** 3)
            L += 545140134
            X *= -262537412640768000  # = -(640320^3)
            term = (M * L) / X
            S += term
            K += 12
            if progress:
                _print_progress(k + 1, n_terms)

    pi = C / S
    return f"{pi:.{digits}f}"


def leibniz_pi(terms: int) -> str:
    """
    Very slow but simple: pi/4 = sum_{k=0}^{N-1} (-1)^k / (2k+1)
    """
    acc = 0.0
    sign = 1.0
    for k in range(terms):
        acc += sign / (2 * k + 1)
        sign = -sign
    val = 4.0 * acc
    return f"{val:.15f}"


def monte_carlo_pi(samples: int, seed: int = 42) -> str:
    """
    Random sampling in unit square; pi ≈ 4 * (points inside quarter circle) / N
    """
    rng = random.Random(seed)
    inside = 0
    for _ in range(samples):
        x, y = rng.random(), rng.random()
        if x * x + y * y <= 1.0:
            inside += 1
    est = 4.0 * inside / samples
    # 1-sigma std dev ~ sqrt(p*(1-p)/N) * 4 with p ~ pi/4
    p = math.pi / 4
    sigma = 4.0 * math.sqrt(p * (1 - p) / samples)
    return f"{est:.10f} (±{sigma:.10f} @1σ)"


def gauss_legendre_pi(digits: int, max_iterations: int = 10) -> str:
    """
    Compute pi via the Gauss–Legendre algorithm.

    Converges quadratically (doubles digits per iteration) and is well-suited
    for moderate precision targets on resource-constrained hardware.
    """

    prec = digits + 15
    getcontext().prec = prec

    a = Decimal(1)
    b = Decimal(1) / Decimal(2).sqrt()
    t = Decimal(0.25)
    p = Decimal(1)
    epsilon = Decimal(10) ** (-(digits + 5))

    for _ in range(max_iterations):
        a_next = (a + b) / 2
        b_next = (a * b).sqrt()
        diff = a - a_next
        t -= p * diff * diff
        a = a_next
        b = b_next
        p *= 2
        if abs(a - b) < epsilon:
            break

    pi = ((a + b) ** 2) / (4 * t)
    return f"{pi:.{digits}f}"


def verify_prefix(s: str) -> str:
    """
    Return a short check comparing the first known digits.
    """
    cmp_len = min(len(PI_PREFIX), len(s))
    ok = s[:cmp_len] == PI_PREFIX[:cmp_len]
    return f"prefix_match={ok} first_{cmp_len}='{s[:cmp_len]}'"


def main() -> None:
    ap = argparse.ArgumentParser(description="Compute π on a Raspberry Pi (several methods).")
    ap.add_argument(
        "--method",
        choices=["chud", "gauss", "leibniz", "montecarlo"],
        default="chud",
        help=(
            "chud = Chudnovsky (fast), gauss = Gauss-Legendre, "
            "leibniz = slow series, montecarlo = random estimate"
        ),
    )
    ap.add_argument("--digits", type=int, default=2000, help="decimal digits for chudnovsky")
    ap.add_argument("--terms", type=int, default=2_000_000, help="terms for leibniz")
    ap.add_argument("--samples", type=int, default=5_000_000, help="samples for montecarlo")
    ap.add_argument("--out", type=str, default=None, help="optional output file")
    ap.add_argument("--workers", type=int, default=1, help="parallel workers for chudnovsky")
    ap.add_argument(
        "--progress",
        action="store_true",
        help="display a simple progress bar during chudnovsky computation",
    )
    args = ap.parse_args()

    t0 = time.time()
    if args.method == "chud":
        res = chudnovsky_pi(args.digits, workers=args.workers, progress=args.progress)
        elapsed = time.time() - t0
        print(f"[method=chudnovsky digits={args.digits} workers={args.workers}]")
        print(verify_prefix(res))
        print(f"time_sec={elapsed:.2f}")
        if args.out:
            with open(args.out, "w") as f:
                f.write(res + "\n")
            print(f"wrote: {args.out}")
        else:
            head = res[:80]
            tail = res[-80:] if len(res) > 160 else ""
            print(f"π (head 80): {head}{'…' if tail else ''}")
            if tail:
                print(f"π (tail 80): {tail}")

    elif args.method == "gauss":
        res = gauss_legendre_pi(args.digits)
        elapsed = time.time() - t0
        print(f"[method=gauss-legendre digits={args.digits}]")
        print(verify_prefix(res))
        print(f"time_sec={elapsed:.2f}")
        if args.out:
            with open(args.out, "w") as f:
                f.write(res + "\n")
            print(f"wrote: {args.out}")
        else:
            preview = res[:80]
            tail = res[-80:] if len(res) > 160 else ""
            print(f"π (head 80): {preview}{'…' if tail else ''}")
            if tail:
                print(f"π (tail 80): {tail}")

    elif args.method == "leibniz":
        res = leibniz_pi(args.terms)
        elapsed = time.time() - t0
        print(f"[method=leibniz terms={args.terms}]")
        print(f"approx={res} time_sec={elapsed:.2f}")
        print("note: converges painfully slowly; use only for demonstration.")

    else:
        res = monte_carlo_pi(args.samples)
        elapsed = time.time() - t0
        print(f"[method=montecarlo samples={args.samples}]")
        print(f"approx={res} time_sec={elapsed:.2f}")
        print("note: accuracy grows ~ 1/sqrt(N); increase samples for better precision.")


if __name__ == "__main__":
    main()
