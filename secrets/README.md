# Secrets Directory

This folder stores sensitive credentials and is ignored by Git.

## Usage

1. Save your Droplet's private SSH key to `secrets/droplet_key` and set permissions:
   ```bash
   chmod 600 secrets/droplet_key
   ```
2. Copy `droplet.env.example` to `droplet.env` and fill in the values, including the passphrase:
   ```bash
   cp secrets/droplet.env.example secrets/droplet.env
   # edit secrets/droplet.env
   ```
3. Load the key when needed:
   ```bash
   ssh-add secrets/droplet_key
   ```

`droplet_key` and `droplet.env` remain private and are not committed to the repository.

_Last updated on 2025-09-11_
