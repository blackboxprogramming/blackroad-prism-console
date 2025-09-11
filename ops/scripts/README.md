# Operations Scripts

This directory contains scripts used for operating and maintaining BlackRoad services.

## br-cleanup.sh

`br-cleanup.sh` is a multipurpose cleanup tool that can audit, fix, and prune a BlackRoad deployment.

### Installation

```bash
sudo cp br-cleanup.sh /usr/local/sbin/br-cleanup.sh
sudo chmod +x /usr/local/sbin/br-cleanup.sh
```

### Usage

```bash
sudo br-cleanup.sh audit    # read-only checks
sudo br-cleanup.sh fix      # apply safe fixes
sudo br-cleanup.sh prune    # prune containers and caches
sudo br-cleanup.sh full     # audit + fix + prune
```

Logs can be captured under `/srv/ops`, for example:

```bash
sudo br-cleanup.sh audit | tee /srv/ops/cleanup-audit.txt
```

An optional systemd timer can be used to run the audit and prune steps nightly.

_Last updated on 2025-09-11_
