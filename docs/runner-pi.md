# Self-hosted GitHub Runner on the Pi

We run the Tor Onion Export workflow **on the Pi** so it can read the real
`/var/lib/tor/lightning/hostname` from the Tor container locally.

## Install runner (once)
1. Create a runner in GitHub: Repo → **Settings → Actions → Runners → New self-hosted runner**.
2. Choose **Linux** / **ARM64**; follow the printed commands on the Pi:
   ```bash
   # example (from GitHub’s UI):
   mkdir -p ~/actions-runner && cd ~/actions-runner
   curl -o actions-runner-linux-arm64-<ver>.tar.gz -L https://...
   tar xzf actions-runner-linux-arm64-<ver>.tar.gz
   ./config.sh --url https://github.com/<org>/<repo> --token <TOKEN>
   ```
3. Add labels so workflows can target this runner (recommended label: `blackroad-pi`).
   You can set labels during `./config.sh` or later in the UI.
4. (Optional) Install as a service:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

## Requirements on the Pi
- Docker/Compose installed (already in your setup).
- Your `btc-compose.yml` and Tor sidecar file available at the paths used by the workflow. By default we reference:
  - `~/btc-compose.yml`
  - `lightning/tor/compose.tor.yml` (from repo)
