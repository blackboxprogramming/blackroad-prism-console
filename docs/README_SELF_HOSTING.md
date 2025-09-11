# Self-Hosting Lucidia/BlackRoad

These steps install the stack on a fresh Ubuntu 22.04 server.

1. Install base packages:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose python3-pip git ufw fail2ban borgbackup
   ```
2. Clone repo and enter infrastructure:
   ```bash
   git clone https://blackroad.io/blackroad-prism-console.git
   cd blackroad-prism-console/infrastructure
   ```
3. Bootstrap mirrors and models (requires initial internet access):
   ```bash
   make bootstrap
   ```
4. Create air-gapped bundle:
   ```bash
   make airgap
   ```
5. Transfer bundle to offline host and extract.
6. Bring stack up without internet:
   ```bash
   make up
   ```
7. Access the UI at [https://blackroad.io](https://blackroad.io).

## Air-gap deployment
Run `make airgap` on a connected machine. Copy the `airgap/` directory to the target host before running `make up`.

_Last updated on 2025-09-11_
