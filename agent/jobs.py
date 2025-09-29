import os
import subprocess

JETSON_HOST = os.getenv("JETSON_HOST", "jetson.local")
JETSON_USER = os.getenv("JETSON_USER", "jetson")


def run_remote(host: str = None, command: str = "", user: str = None):
    host = host or JETSON_HOST
    user = user or JETSON_USER
    subprocess.run(["ssh", "-t", f"{user}@{host}", command], check=True)


def run_remote_stream(host: str = None, command: str = "", user: str = None):
    host = host or JETSON_HOST
    user = user or JETSON_USER
    proc = subprocess.Popen(
        ["ssh", f"{user}@{host}", command],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    try:
        for line in proc.stdout:  # type: ignore
            yield line.rstrip("\n")
    finally:
        proc.stdout and proc.stdout.close()  # type: ignore
        proc.wait()
