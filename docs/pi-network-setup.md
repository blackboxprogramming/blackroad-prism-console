# Raspberry Pi Mesh Connectivity Playbook

This playbook explains how to make the three development machines—`lucidia@pi`, `alice@raspberrypi`, and `alexa@Alexas-MacBook-Pro-2`—reachable from one another and how to install the dependencies required for remote administration.

## 1. Prerequisites

- Administrative access (sudo) on each device.
- Shared local network or VPN so the machines can route to each other.
- Passwordless SSH keys distributed between the hosts.

## 2. Identify and Assign Hostnames

1. Confirm each system's hostname:
   ```bash
   hostnamectl
   ```
2. Record the corresponding IP address:
   ```bash
   ip addr show | grep "inet "
   ```
3. Ensure the hostnames and IP addresses exist in `/etc/hosts` on each machine so they can resolve one another even if DNS is unavailable.

Example entry:
```
192.168.1.42 pi
192.168.1.43 raspberrypi
192.168.1.44 Alexas-MacBook-Pro-2
```

## 3. Enable SSH and Required Services

### Raspberry Pi OS Devices

```bash
sudo apt update
sudo apt install -y openssh-server python3 python3-pip git
sudo systemctl enable --now ssh
```

### macOS Device (Alexa's MacBook Pro)

1. Install the command line developer tools (for `ssh`, `git`, and build utilities):
   ```bash
   xcode-select --install
   ```
2. Ensure Homebrew is available for package management (optional but recommended):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Install Python tooling if needed:
   ```bash
   brew install python3 git
   ```
4. Enable Remote Login (SSH) in **System Settings → General → Sharing**.

## 4. Exchange SSH Keys

On each machine, generate an SSH key if one does not exist:
```bash
ssh-keygen -t ed25519 -C "shared-pi-network"
```

Copy the public key to the other hosts:
```bash
ssh-copy-id lucidia@pi
ssh-copy-id alice@raspberrypi
ssh-copy-id alexa@Alexas-MacBook-Pro-2
```

## 5. Verify Connectivity

Run the helper script from this repository to confirm reachability:
```bash
./scripts/pi_network_check.sh
```

You can supply a custom list of users/hosts:
```bash
./scripts/pi_network_check.sh user1@host-a user2@host-b
```

Review the output for `[WARN]` entries and resolve any reported issues (network routing, SSH configuration, firewall rules, etc.).

## 6. Keep Dependencies Updated

For Debian-based Raspberry Pi systems:
```bash
sudo apt update && sudo apt upgrade -y
```

For macOS with Homebrew:
```bash
brew update
brew upgrade
```

## 7. Troubleshooting Checklist

- Ping by IP first to rule out DNS issues.
- Confirm that firewalls (UFW on Raspberry Pi, macOS Application Firewall) allow inbound SSH.
- Use `ssh -vvv user@host` to inspect authentication problems.
- Verify time synchronization (install `chrony` on Linux or enable "Set time automatically" on macOS).

## 8. Synchronize Repositories Between Machines

Once SSH connectivity is working, push code updates between machines with the `pi_sync.sh` helper:

```bash
./scripts/pi_sync.sh
```

By default the script copies the current repository to `alice@raspberrypi:~/blackroad-prism-console`. Override the destination with the `-r` flag or by setting the `PI_REMOTE` environment variable:

```bash
PI_REMOTE="alice@raspberrypi:/srv/blackroad" ./scripts/pi_sync.sh
```

Useful flags:

- `-n` performs a dry run to preview changes without copying files.
- `-s` lets you sync a specific local subdirectory instead of the entire repo.
- `-x` points to a custom exclude file. You can also set `PI_SYNC_EXCLUDE` for a persistent override.
- `--pull` inverts the direction so you can fetch changes from the Raspberry Pi back to your workstation.
- Arguments after `--` pass straight to `rsync` (for example `-- --progress`).

The script skips common transient build artifacts via `scripts/pi_sync_exclude.txt`. Adjust that list—or point to your own with `-x`/`PI_SYNC_EXCLUDE`—if your workflow requires syncing additional paths.

Following this playbook ensures each device can reach the others over the network, share the same codebase, and has the toolchain required for collaborative development.
