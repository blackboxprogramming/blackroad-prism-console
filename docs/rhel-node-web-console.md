# RHEL Web Console & Node.js 20 Setup

This runbook captures the quickest way to bring a Red Hat Enterprise Linux
(RHEL 9 / CentOS Stream 9) host online for BlackRoad Prism Console work. It
covers enabling the web console (Cockpit) and installing a supported Node.js 20
runtime for the repo tooling.

> **Scope:** Run these commands directly on the target server over SSH or the
> serial console. You will need an account with `sudo` privileges.

## 1. Enable the Cockpit Web Console

RHEL ships a browser-based admin panel called **Cockpit**. If you see a prompt
such as `Activate the Web console with systemctl enable --now cockpit.socket`,
the service is present but disabled. Enable it and open the firewall:

```bash
sudo systemctl enable --now cockpit.socket
sudo firewall-cmd --permanent --add-service=cockpit
sudo firewall-cmd --reload
```

Then visit `https://<server-hostname>:9090/` in a browser and log in with your
Linux credentials. Cockpit is optional for repo work, but it is handy for
verifying services, viewing logs, and transferring files from another device.

## 2. Install Node.js 20 via DNF modules

The project expects **Node.js 20**. On RHEL-family systems you should rely on
the distribution packages rather than `pip install nodejs` (which is a Python
binding and will not provide the Node runtime).

1. Check which Node streams are available:
   ```bash
   sudo dnf module list nodejs
   ```
2. Enable the 20.x stream and install the runtime and build tools:
   ```bash
   sudo dnf module enable nodejs:20
   sudo dnf install nodejs gcc-c++ make
   ```
3. Verify the installation:
   ```bash
   node -v
   npm -v
   ```
   Expect outputs such as `v20.x.y` and `10.x.y`.

If you enabled a different stream previously, reset before enabling the new one:

```bash
sudo dnf module reset nodejs
sudo dnf module enable nodejs:20
```

## 3. Alternate: NodeSource repository

If your mirror does not publish the Node.js 20 module, install from the
[NodeSource RPM repository](https://github.com/nodesource/distributions):

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install nodejs gcc-c++ make
```

This registers the NodeSource repo, installs Node.js 20, and keeps it updated
with future `dnf upgrade` runs.

## 4. Finish the repo setup

After Node.js is installed, clone or update the repository and install the
JavaScript dependencies:

```bash
cd /path/to/blackroad-prism-console
npm install
```

You can now run project scripts such as `npm run lint`, `npm run build`, or the
Next.js dev server locally.

## 5. Troubleshooting

- **`pip install nodejs` fails:** The `pip` package provides Python bindings and
  cannot satisfy the Node runtime requirement. Use `dnf` as shown above.
- **Module enable errors:** Reset the module (`sudo dnf module reset nodejs`)
  before enabling the `20` stream.
- **Firewall blocked Cockpit:** Ensure `firewalld` is running and reload after
  adding the service rule, or open TCP 9090 explicitly.
- **Missing compilers for native addons:** Install `gcc`, `gcc-c++`, `make`, and
  `python3` from the base repositories so `npm install` can compile native
  modules.

Document owner: Ops & Enablement Guild. Last reviewed: 2025-10-05.
