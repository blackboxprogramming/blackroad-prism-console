import os
import subprocess
import shlex

JETSON_HOST = os.getenv("JETSON_HOST", "jetson.local")
JETSON_USER = os.getenv("JETSON_USER", "jetson")

def _run(cmd: str) -> str:
    try:
        return subprocess.check_output(shlex.split(cmd), text=True).strip()
    except Exception as e:
        return f"error: {e}"


def collect_local() -> dict:
    return {
        "hostname": _run("hostname"),
        "uname": _run("uname -a"),
        "uptime": _run("uptime -p"),
        "disk": _run("df -h /etc/hosts"),  # quick visible disk line
    }


def collect_remote(host: str = None, user: str = None) -> dict:
    host = host or JETSON_HOST
    user = user or JETSON_USER
    base = f"{user}@{host}"

    def ssh(cmd: str) -> str:
        try:
            return subprocess.check_output(
                ["ssh", "-o", "ConnectTimeout=3", base, cmd],
                text=True
            ).strip()
        except Exception as e:
            return f"error: {e}"

    return {
        "hostname": ssh("hostname"),
        "uname": ssh("uname -a"),
        "uptime": ssh("uptime -p"),
        "disk": ssh("df -h /etc/hosts"),
    }
