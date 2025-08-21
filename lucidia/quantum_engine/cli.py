"""CLI entrypoint for the quantum engine."""
from __future__ import annotations

import argparse
import torch

from .policy import guard_env, set_seed
from .models import PQCClassifier, QAOAModel, VQEModel
from .device import Device


def _run(args: argparse.Namespace) -> None:
    model_map = {
        'vqe': VQEModel,
        'qaoa': QAOAModel,
        'qkernel': PQCClassifier,
    }
    model = model_map[args.example](n_wires=args.wires)
    x = torch.zeros(args.shots, 1, device=args.device)
    out = model(x)
    print(out.mean().item())


def _bench(args: argparse.Namespace) -> None:
    print(f"running {args.suite} bench")


def _qasm(args: argparse.Namespace) -> None:
    dev = Device(n_wires=2)
    with open(args.outfile, 'w', encoding='utf-8') as fh:
        fh.write(dev.qasm())


def main() -> None:
    guard_env()
    parser = argparse.ArgumentParser(prog='lucidia-quantum')
    parser.add_argument('--seed', type=int, default=0)
    sub = parser.add_subparsers(dest='cmd', required=True)

    runp = sub.add_parser('run')
    runp.add_argument('--example', choices=['vqe', 'qaoa', 'qkernel'], required=True)
    runp.add_argument('--wires', type=int, default=4)
    runp.add_argument('--shots', type=int, default=1024)
    runp.add_argument('--device', type=str, default='cpu')

    benchp = sub.add_parser('bench')
    benchp.add_argument('--suite', choices=['smoke', 'full'], default='smoke')

    qasmp = sub.add_parser('qasm')
    qasmp.add_argument('--in', dest='infile', required=True)
    qasmp.add_argument('--out', dest='outfile', required=True)

    args = parser.parse_args()
    set_seed(args.seed)
    if args.cmd == 'run':
        _run(args)
    elif args.cmd == 'bench':
        _bench(args)
    elif args.cmd == 'qasm':
        _qasm(args)


if __name__ == '__main__':  # pragma: no cover
    main()
