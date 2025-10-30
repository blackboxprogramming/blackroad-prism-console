#!/usr/bin/env python3
"""Locate an accessible Jetson device on the local network."""
from __future__ import annotations

import argparse
import ipaddress
import math
import os
import shutil
import socket
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Set

DEFAULT_CANDIDATES: Sequence[str] = (
    "jetson.local",
    "jetson",
    "jetson-01.local",
    "jetson-01",
    "192.168.4.23",
)
DEFAULT_USER = os.environ.get("JETSON_USER", "jetson")


@dataclass
class ProbeResult:
    host: str
    status: str
    detail: str
    confirmed: bool = False


def _port_open(host: str, port: int = 22, timeout: float = 1.5) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _run_ssh_probe(host: str, user: str, timeout: float) -> ProbeResult:
    if shutil.which("ssh") is None:
        return ProbeResult(host, "reachable", "SSH client not installed locally; cannot verify Jetson.")

    timeout_ceiling = max(1, int(math.ceil(timeout)))

    cmd = [
        "ssh",
        "-o",
        "BatchMode=yes",
        "-o",
        "StrictHostKeyChecking=accept-new",
        "-o",
        f"ConnectTimeout={timeout_ceiling}",
        f"{user}@{host}",
        "cat /etc/nv_tegra_release 2>/dev/null || cat /etc/os-release 2>/dev/null",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    except OSError as exc:
        return ProbeResult(host, "ssh-error", f"Failed to execute ssh: {exc}")

    stdout = (result.stdout or "").strip()
    stderr = (result.stderr or "").strip()

    if result.returncode == 0:
        summary = stdout.splitlines()[0] if stdout else "SSH command succeeded."
        lowered = stdout.lower()
        if any(token in lowered for token in ("jetson", "tegra", "nvidia")):
            return ProbeResult(host, "jetson-confirmed", summary, confirmed=True)
        return ProbeResult(host, "ssh-ok", summary)

    if result.returncode == 255:
        if stderr:
            detail = stderr.splitlines()[-1]
        else:
            detail = "Authentication failed; provide SSH key or passwordless access."
        return ProbeResult(host, "auth-failed", detail)

    detail = stderr.splitlines()[-1] if stderr else f"SSH exited with code {result.returncode}."
    return ProbeResult(host, "ssh-error", detail)


def probe_host(host: str, user: str, timeout: float) -> ProbeResult:
    if not _port_open(host, 22, timeout):
        return ProbeResult(host, "unreachable", "No response on TCP port 22 (SSH)")
    return _run_ssh_probe(host, user, timeout)


def parse_networks(cidr_values: Sequence[str]) -> List[ipaddress.IPv4Network]:
    networks: List[ipaddress.IPv4Network] = []
    for value in cidr_values:
        try:
            network = ipaddress.ip_network(value, strict=False)
        except ValueError as exc:
            print(f"[WARN] Skipping invalid subnet '{value}': {exc}", file=sys.stderr)
            continue
        if isinstance(network, ipaddress.IPv6Network):
            print(f"[WARN] Skipping IPv6 network '{value}' (not supported)", file=sys.stderr)
            continue
        networks.append(network)
    return networks


def _prefix_from_netmask(netmask: str) -> Optional[int]:
    try:
        if netmask.startswith(("0x", "0X")):
            mask_value = int(netmask, 16)
            network = ipaddress.IPv4Network((0, mask_value), strict=False)
        else:
            network = ipaddress.IPv4Network((0, netmask), strict=False)
    except (ValueError, ipaddress.NetmaskValueError):
        return None
    return network.prefixlen


def collect_local_networks() -> List[ipaddress.IPv4Network]:
    networks: List[ipaddress.IPv4Network] = []

    def _append_network(network: ipaddress.IPv4Network) -> None:
        if network.is_loopback or network.is_link_local:
            return
        if isinstance(network, ipaddress.IPv6Network):
            return
        if network not in networks:
            networks.append(network)

    if shutil.which("ip") is not None:
        try:
            result = subprocess.run(
                ["ip", "-o", "-4", "addr", "show"],
                capture_output=True,
                text=True,
                check=False,
            )
        except OSError:
            result = None
        else:
            for line in result.stdout.splitlines():
                parts = line.split()
                if "inet" not in parts:
                    continue
                idx = parts.index("inet")
                if idx + 1 >= len(parts):
                    continue
                cidr = parts[idx + 1]
                try:
                    interface = ipaddress.ip_interface(cidr)
                except ValueError:
                    continue
                network = interface.network
                _append_network(network)

    if networks:
        return networks

    if shutil.which("ifconfig") is None:
        return networks

    try:
        result = subprocess.run(["ifconfig"], capture_output=True, text=True, check=False)
    except OSError:
        return networks

    for raw_line in result.stdout.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("inet6"):
            continue
        if "inet " not in line:
            continue
        parts = line.split()
        try:
            idx = parts.index("inet")
        except ValueError:
            continue
        if idx + 1 >= len(parts):
            continue
        address = parts[idx + 1]
        if address.startswith("127."):
            continue
        netmask: Optional[str] = None
        for token in ("netmask", "mask"):
            if token in parts:
                token_idx = parts.index(token)
                if token_idx + 1 < len(parts):
                    netmask = parts[token_idx + 1]
                    break
        if not netmask:
            continue
        prefix = _prefix_from_netmask(netmask)
        if prefix is None:
            continue
        try:
            interface = ipaddress.ip_interface(f"{address}/{prefix}")
        except ValueError:
            continue
        network = interface.network
        _append_network(network)

    return networks


def hosts_in_network(network: ipaddress.IPv4Network, limit: int) -> Iterable[str]:
    usable_hosts = (network.num_addresses - 2) if network.prefixlen <= 30 else network.num_addresses
    if limit > 0 and usable_hosts > limit:
        print(
            f"[INFO] Skipping sweep of {network} ({usable_hosts} hosts) — exceeds limit {limit}.",
            file=sys.stderr,
        )
        return []
    return (str(host) for host in network.hosts())


def display_result(result: ProbeResult) -> None:
    status = result.status
    prefix = {
        "jetson-confirmed": "[FOUND]",
        "ssh-ok": "[INFO]",
        "auth-failed": "[HINT]",
        "ssh-error": "[WARN]",
        "reachable": "[INFO]",
        "unreachable": "[WARN]",
        "internal-error": "[WARN]",
    }.get(status, "[INFO]")
    print(f"{prefix} {result.host}: {result.detail}")


def probe_batch(
    hosts: Sequence[str],
    user: str,
    timeout: float,
    workers: int,
) -> List[ProbeResult]:
    if not hosts:
        return []

    ordered_hosts: Dict[str, int] = {host: idx for idx, host in enumerate(hosts)}

    if workers <= 1:
        results = [probe_host(host, user, timeout) for host in hosts]
    else:
        results: List[ProbeResult] = []
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(probe_host, host, user, timeout): host for host in hosts}
            for future in as_completed(futures):
                host = futures[future]
                try:
                    result = future.result()
                except Exception as exc:  # noqa: BLE001 - surface unexpected issues
                    result = ProbeResult(host, "internal-error", f"Unhandled error: {exc}")
                results.append(result)
    results.sort(key=lambda item: ordered_hosts.get(item.host, 0))
    return results


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Discover an accessible Jetson host on the network.")
    parser.add_argument("--host", dest="hosts", action="append", help="Candidate host to probe (repeatable).")
    parser.add_argument("--subnet", dest="subnets", action="append", help="CIDR subnet to scan (repeatable).")
    parser.add_argument("--user", default=DEFAULT_USER, help="SSH user to probe with (default: %(default)s).")
    parser.add_argument(
        "--timeout",
        type=float,
        default=3.0,
        help="Seconds to wait for SSH connectivity (default: %(default)s).",
    )
    parser.add_argument(
        "--max-hosts",
        type=int,
        default=256,
        help="Maximum hosts to scan per subnet (0 disables the limit).",
    )
    parser.add_argument(
        "--skip-defaults",
        action="store_true",
        help="Do not probe the built-in hostnames (jetson.local, jetson-01, etc.).",
    )
    parser.add_argument(
        "--skip-scan",
        action="store_true",
        help="Do not sweep local subnets; only probe explicit hostnames.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=16,
        help="Concurrent SSH probe workers (default: %(default)s).",
    )
    args = parser.parse_args(argv)

    seen: Set[str] = set()
    candidates: List[str] = []
    if not args.skip_defaults:
        candidates.extend(DEFAULT_CANDIDATES)
    if args.hosts:
        candidates.extend(args.hosts)

    unique_candidates = []
    for candidate in candidates:
        if candidate and candidate not in seen:
            unique_candidates.append(candidate)
            seen.add(candidate)

    confirmed: List[ProbeResult] = []
    potential: List[ProbeResult] = []

    workers = max(1, args.workers)

    if unique_candidates:
        print("[INFO] Probing candidate hosts...")
    candidate_results = probe_batch(unique_candidates, args.user, args.timeout, workers)
    for result in candidate_results:
        display_result(result)
        potential.append(result)
        if result.confirmed:
            confirmed.append(result)

    if confirmed:
        print("\n[OK] Jetson host located via direct probe.")
        return 0

    if args.skip_scan:
        print("\n[WARN] No Jetson confirmed. Provide additional hosts or allow subnet scanning.")
        return 1

    subnets: List[ipaddress.IPv4Network] = []
    if args.subnets:
        subnets.extend(parse_networks(args.subnets))

    local_networks = collect_local_networks()
    for network in local_networks:
        if network not in subnets:
            subnets.append(network)

    if not subnets:
        print("\n[WARN] No subnets available to scan. Supply --subnet to specify a network.")
        return 1

    print("\n[INFO] Sweeping local subnets for Jetson hosts...")

    for network in subnets:
        print(f"[INFO] Scanning {network}...")
        hosts_to_probe: List[str] = []
        for host in hosts_in_network(network, args.max_hosts):
            if host in seen:
                continue
            seen.add(host)
            hosts_to_probe.append(host)

        results = probe_batch(hosts_to_probe, args.user, args.timeout, workers)
        for result in results:
            if result.status == "unreachable":
                continue
            display_result(result)
            potential.append(result)
            if result.confirmed:
                print("\n[OK] Jetson host located during subnet sweep.")
                return 0

    print("\n[WARN] Completed scan without confirming a Jetson host.")
    if potential:
        reachable = [r.host for r in potential if r.status in {"auth-failed", "ssh-ok", "reachable"}]
        if reachable:
            print("[HINT] Hosts with SSH reachable but unconfirmed: " + ", ".join(reachable))
            print("[HINT] Provide credentials (ssh key) and rerun to confirm.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
