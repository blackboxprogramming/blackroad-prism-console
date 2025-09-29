# Droplet Disk Maintenance Runbook

This runbook documents the routine checks and cleanup tasks to prevent DigitalOcean droplets from running out of disk space due to Docker artifacts and system logs.

## Quick Health Checks

Run these commands to inspect filesystem capacity and inode availability:

```bash
# Overall disk and inode usage
$ df -hT
$ df -i
```

Inspect Docker utilization to understand how space is consumed:

```bash
# Docker disk usage summary
$ docker system df

# Largest images, containers, and volumes
$ docker images --format 'table {{.Size}}\t{{.Repository}}:{{.Tag}}\t{{.ID}}' | sort -hr
$ docker ps -a --size --format 'table {{.Size}}\t{{.Names}}\t{{.Image}}' | sort -hr
$ docker volume ls -q | xargs -r -I{} sh -c 'docker system df -v | grep -A2 "{}"'
```

## Targeted Cleanup Options

Choose the smallest set of commands needed to reclaim space:

```bash
# 1) Remove unused containers, networks, and build cache (safe default)
$ docker system prune -f

# 2) Also remove dangling and unused images (ensure no container needs them)
$ docker image prune -a -f

# 3) Clear the builder cache (can be large)
$ docker builder prune -a -f

# 4) Remove unused volumes (data loss risk if volumes mattered)
$ docker volume prune -f
```

### Non-Docker Sources

Investigate other common space hogs:

```bash
# Large log directories
$ sudo du -x -h /var/log | sort -hr | head

# Shrink systemd journal to 200 MB
$ sudo journalctl --vacuum-size=200M

# Clear apt caches
$ sudo apt-get clean

# Identify large directories from root
$ sudo du -x -h -d1 / | sort -hr | head -n 30
```

### One-Liner Rescue

When you need a fast cleanup without removing in-use images or named volumes:

```bash
$ sudo journalctl --vacuum-time=7d \
    && sudo apt-get clean \
    && docker system prune -f \
    && docker builder prune -a -f \
    && docker image prune -f
```

## Proactive Alerting

Install the `disk_warn.sh` helper script and schedule it via cron to alert before disk space runs out:

```bash
$ sudo cp ops/do/disk_warn.sh /usr/local/bin/disk_warn.sh
$ sudo chmod +x /usr/local/bin/disk_warn.sh
$ ( crontab -l 2>/dev/null; echo "*/30 * * * * /usr/local/bin/disk_warn.sh" ) | crontab -
```

The script warns when the root filesystem has less than 10% free space, writing a timestamped warning to stdout. Adjust the `thresh` variable or target filesystem inside the script as needed.

## Operational Tips

- Always confirm that critical containers are stopped or can be recreated before removing images or volumes.
- Capture the output of the health checks in the ticket or incident doc so follow-up actions can be audited.
- After aggressive pruning, redeploy long-running services to ensure required images are rebuilt and cached.
- If disk pressure recurs frequently, plan capacity upgrades or move large stateful data into managed services.
