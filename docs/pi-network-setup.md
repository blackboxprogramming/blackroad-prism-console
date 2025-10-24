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

## 6. Reach Alice's Raspberry Pi from VS Code

Once ping and SSH succeed, you can open Alice's Pi directly in Visual Studio Code:

1. Install the **Remote - SSH** extension in VS Code on your local workstation.
2. From the command palette, choose **Remote-SSH: Connect to Host...** and enter `alice@raspberrypi` (or the IP address).
3. VS Code will establish an SSH tunnel; reuse the same key that `ssh-copy-id` installed earlier.
4. After the first connection, VS Code saves the host entry. You can reconnect later with:
   ```bash
   code --remote ssh-remote+alice@raspberrypi
   ```
5. If prompted to select the remote platform, choose **Linux** and allow VS Code to install the server components on the Pi.

### Optional: enable a lightweight desktop session

If Alice needs a graphical desktop, enable VNC on the Pi after SSHing in:

```bash
sudo raspi-config
# Interface Options → VNC → Enable
```

Use a VNC client (RealVNC, Screens, etc.) to connect to `raspberrypi:5900` with Alice's credentials. Keep SSH enabled so VS Code and terminal sessions remain available.

## 7. Keep Dependencies Updated

For Debian-based Raspberry Pi systems:
```bash
sudo apt update && sudo apt upgrade -y
```

For macOS with Homebrew:
```bash
brew update
brew upgrade
```

## 8. Troubleshooting Checklist

- Ping by IP first to rule out DNS issues.
- Confirm that firewalls (UFW on Raspberry Pi, macOS Application Firewall) allow inbound SSH.
- Use `ssh -vvv user@host` to inspect authentication problems.
- Verify time synchronization (install `chrony` on Linux or enable "Set time automatically" on macOS).

Following this playbook ensures each device can reach the others over the network and has the toolchain required for collaborative development.
