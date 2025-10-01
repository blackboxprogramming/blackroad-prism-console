import ipaddress
import json
import shlex
import subprocess


def _run(cmd):
    try:
        return subprocess.check_output(shlex.split(cmd), text=True).strip()
    except Exception:
        return ""


def _subnet():
    """Return a bounded IPv4 network for scanning.

    The interface's configured subnet might be very large (e.g. /8 corp
    networks or /16 docker bridges). We cap scans to the interface's /24 to
    avoid issuing tens of thousands of sequential probes.
    """

    # grab first IPv4 interface that's UP and not loopback
    lines = _run("ip -br -4 addr").splitlines()
    for ln in lines:
        parts = ln.split()
        if len(parts) >= 3 and parts[0] != "lo":
            cidr = parts[2]  # e.g. 192.168.4.12/24
            iface = ipaddress.ip_interface(cidr)
            if iface.network.prefixlen >= 24:
                return iface.network
            return ipaddress.ip_network(f"{iface.ip}/24", strict=False)
    return None


def _ping(ip):
    try:
        subprocess.check_output(
            ["ping", "-c", "1", "-W", "1", str(ip)], stderr=subprocess.DEVNULL
        )
        return True
    except Exception:
        return False


def _mdns_name(ip):
    # try avahi-resolve (if present)
    out = _run(f"avahi-resolve -a {ip}")
    if out and " " in out:
        return out.split(" ", 1)[1].strip()
    return ""


def _ssh_ok(ip, user="jetson"):
    try:
        subprocess.check_output(
            [
                "ssh",
                "-o",
                "ConnectTimeout=1",
                "-o",
                "BatchMode=yes",
                f"{user}@{ip}",
                "true",
            ],
            stderr=subprocess.DEVNULL,
        )
        return True
    except Exception:
        return False


def _is_jetson(ip, user="jetson"):
    try:
        out = subprocess.check_output(
            [
                "ssh",
                "-o",
                "ConnectTimeout=2",
                f"{user}@{ip}",
                "uname -a && command -v nvidia-smi >/dev/null && nvidia-smi --query-gpu=name --format=csv,noheader || echo no-gpu",
            ],
            text=True,
            stderr=subprocess.DEVNULL,
        )
        return "no-gpu" not in out
    except Exception:
        return False


def scan():
    net = _subnet()
    if not net:
        return {"error": "no subnet"}
    hosts = []
    for ip in net.hosts():
        ip_s = str(ip)
        if not _ping(ip_s):
            continue
        name = _mdns_name(ip_s)
        ssh = _ssh_ok(ip_s) or _ssh_ok(ip_s, "ubuntu") or _ssh_ok(ip_s, "nvidia")
        kind = "unknown"
        if ssh and (_is_jetson(ip_s) or _ssh_ok(ip_s, "ubuntu")):
            kind = "jetson" if _is_jetson(ip_s) else "ssh"
        hosts.append({"ip": ip_s, "name": name, "ssh": ssh, "kind": kind})
    return {"network": str(net), "hosts": hosts}
