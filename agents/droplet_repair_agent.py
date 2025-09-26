"""DigitalOcean droplet repair and maintenance agent.

This module automates recovery of SSH access, disk cleanup, and basic
monitoring for a DigitalOcean droplet. It aims to be idempotent and safe to
re-run, logging each major action. Network operations are best-effort; the
agent prints informative messages when steps cannot be completed.
"""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

import requests


@dataclass
class DropletRepairAgent:
    """Recover SSH access and free disk space on a droplet.

    Attributes:
        do_api_token: DigitalOcean API token.
        droplet_ip_last_octet: Last octet of the droplet IPv4 address.
        ssh_user: User to connect via SSH.
        archive_dir: Directory on the droplet for archived files.
        target_free_space: Desired free space (``df -h`` format).
        slack_webhook_url: Optional Slack webhook for disk alerts.
    """

    do_api_token: str
    droplet_ip_last_octet: str = "159"
    ssh_user: str = "root"
    archive_dir: str = "/srv/archives"
    target_free_space: str = "10G"
    slack_webhook_url: Optional[str] = field(
        default_factory=lambda: os.environ.get("SLACK_WEBHOOK_URL")
    )

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.do_api_token}",
            "Accept": "application/json",
        }

    def discover_droplet(self) -> Dict[str, Any]:
        """Locate droplet information by matching the final IP octet."""
        url = "https://api.digitalocean.com/v2/droplets"
        resp = requests.get(url, headers=self._headers(), timeout=30)
        resp.raise_for_status()
        for droplet in resp.json().get("droplets", []):
            for net in droplet.get("networks", {}).get("v4", []):
                ip = net.get("ip_address", "")
                if ip.endswith(f".{self.droplet_ip_last_octet}"):
                    return {
                        "id": droplet["id"],
                        "name": droplet["name"],
                        "ip": ip,
                        "region": droplet["region"]["slug"],
                    }
        raise RuntimeError("droplet not found")

    def _ssh(self, host: str, command: str, identity: Optional[str] = None) -> subprocess.CompletedProcess:
        """Run an SSH command and return the completed process."""
        cmd = ["ssh", f"{self.ssh_user}@{host}", command]
        if identity:
            cmd.insert(1, "-i")
            cmd.insert(2, identity)
        return subprocess.run(cmd, capture_output=True, text=True, check=False)

    def ensure_key_login(self, host: str, pubkey: str) -> None:
        """Install an SSH public key on the droplet if missing."""
        installer = (
            "mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
            "touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && "
            f"grep -qxF '{pubkey}' ~/.ssh/authorized_keys || echo '{pubkey}' >> ~/.ssh/authorized_keys"
        )
        result = self._ssh(host, installer)
        if result.returncode != 0:
            print("failed to install key:", result.stderr.strip())
        else:
            print("public key installed or already present")

    def free_disk_space(self, host: str) -> None:
        """Compress large logs and clean caches on the droplet."""
        script = (
            "set -eu;"
            f"mkdir -p {self.archive_dir};"
            "find / -xdev -type f -name '*.log' -size +50M -exec gzip -f {} \;;"
            f"mv /var/log/*.gz {self.archive_dir}/ 2>/dev/null || true;"
            "apt-get clean >/dev/null 2>&1 || true;"
            "journalctl --vacuum-time=7d >/dev/null 2>&1 || true;"
            "df -h / | tee -a /var/log/blackroad-repair.log"
        )
        result = self._ssh(host, script)
        if result.returncode != 0:
            print("disk cleanup failed:", result.stderr.strip())
        else:
            print(result.stdout.strip())

    def install_disk_monitor(self, host: str) -> None:
        """Install a simple cron job to monitor disk usage."""
        if not self.slack_webhook_url:
            print("no Slack webhook configured; skipping monitor install")
            return
        cron_line = (
            f"*/15 * * * * df -h / | awk 'NR==2{{print $5}}' | grep -q '[9][0-9]%' "
            "&& curl -s -X POST -H 'Content-type: application/json' "
            f"--data '{{\"text\":\"ALERT: / usage high on {host}\"}}' {self.slack_webhook_url}"
        )
        script = f"(crontab -l 2>/dev/null; echo '{cron_line}') | crontab -"
        result = self._ssh(host, script)
        if result.returncode != 0:
            print("monitor install failed:", result.stderr.strip())
        else:
            print("disk monitor cron installed")

    def run(self) -> None:
        """Execute the full repair workflow."""
        droplet = self.discover_droplet()
        host = droplet["ip"]
        print(f"discovered droplet {droplet['name']} ({droplet['id']}) at {host}")
        pubkey = os.environ.get("PUBLIC_KEY", "")
        if pubkey:
            self.ensure_key_login(host, pubkey)
        else:
            print("PUBLIC_KEY not provided; skipping key installation")
        self.free_disk_space(host)
        self.install_disk_monitor(host)
        print("repair sequence complete")


if __name__ == "__main__":
    token = os.environ.get("DO_API_TOKEN")
    if not token:
        raise SystemExit("DO_API_TOKEN environment variable required")
    agent = DropletRepairAgent(do_api_token=token)
    agent.run()
