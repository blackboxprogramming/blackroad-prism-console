# Portal QR and Tor Utilities

This directory now includes helper scripts for handling PSBT workflows over QR codes and for serving the health report through a Tor hidden service.

## Directory layout

- `bin/` – command-line helpers deployed to `/home/pi/portal/bin`.
- `psbts/` – working storage for PSBT files to be encoded/decoded.
- `reports/` – location for generated portal reports such as `health.html`.
- `logs/` – reserved for runtime log output.

## Dependencies

Install the required packages on the Raspberry Pi (or target host):

```bash
sudo apt-get install qrencode zbar-tools tor
```

## Commands

| Script | Purpose |
| --- | --- |
| `portal-env` | Check the runtime environment and required dependencies. |
| `portal-run` | Execute the one-button workflow (proof → health → checklist). |
| `portal-selftest` | Run a quick smoke test that builds a PSBT and verifies signing flow without broadcasting. |
| `descriptor-lint <descriptor.txt> [--expect-branch both|external|change] [--min-range N]` | Lint raw descriptors or xpubs before scanning/spending to catch branch/range issues. |
| `portal-help` | Display a help index of the major Portal commands and workflows. |
| `psbt-to-qr <file.psbt> [out.png]` | Encode a (signed or unsigned) PSBT into a QR image. Files larger than ~2500 base64 characters are split into numbered parts. |
| `qr-to-psbt <out.psbt> <img1.png> [img2.png ...]` | Reconstruct a PSBT from one or more QR images scanned on an offline machine. |
| `portal-static [addr:port]` | Serve `reports/health.html` over HTTP on localhost. Used internally by the Tor helper. |
| `portal-health-tor` | Print the Tor onion URL for the health page and launch the local static server on `127.0.0.1:8088`. |
| `psbt-fake-sign <label>` | Clone `<label>.psbt` to `<label>.signed.psbt` for offline signer simulations and automated tests. |
| `portal-pack <version>` | Build a `.deb` package of the portal tree for clean installs on other Raspberry Pis. |

The new `portal-env` helper checks that `bitcoin-cli`, `jq`, and `python3` are available and that `configs/raw.descriptor` is populated. `portal-run` chains a descriptor proof, the health report generator, and the checklist builder for a single-command operations sweep. `portal-selftest` performs a key-safe smoke test that exercises PSBT creation and verification using the `psbt-fake-sign` shim, while `portal-help` prints a concise index of the most common workflows.

### Nightly proofs, log rotation, and REST shim

The Raspberry Pi deployment picks up three additional helpers to keep proofs fresh and
expose a localhost-only API surface:

1. **Log rotation** – install the sample config in `/etc/logrotate.d/portal` to rotate
   `~/portal/logs/*.log` daily with a 14-day retention window:
   ```bash
   sudo cp ~/portal/configs/logrotate.portal /etc/logrotate.d/portal
   sudo logrotate --force /etc/logrotate.d/portal  # optional smoke-test
   ```
2. **Nightly proofs** – `~/portal/bin/portal-nightly` re-generates proofs at
   02:17 UTC when `configs/raw.descriptor` is present. Install the cron job via:
   ```bash
   ( crontab -l 2>/dev/null | grep -v 'portal-nightly' ; \
     echo "17 2 * * * /home/pi/portal/bin/portal-nightly" ) | crontab -
   ```
   Logs land in `~/portal/logs/nightly.YYYYMMDD.log`.
3. **REST shim** – `~/portal/bin/portal-rest` binds to `127.0.0.1:8787` and requires
   a bearer token stored at `~/portal/configs/api.token` (copy
   `api.token.example`, replace the value with a random string, and run
   `chmod 600 ~/portal/configs/api.token`). Start it manually or wire it up to
   systemd with the provided unit file:
   ```bash
   sudo cp ~/portal/systemd/portal-rest.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now portal-rest.service
   ```
   The `ENABLE_PSBT_API` environment variable gates the PSBT authoring endpoint
   and defaults to `0` (read-only mode).

Run `~/portal/ops/last_mile_glue.sh` to apply the full set of steps above on a
fresh Raspberry Pi deployment.

Curl example (replace `${TOKEN}` with the generated value):

```bash
curl -s \
  -H "Authorization: Bearer ${TOKEN}" \
  http://127.0.0.1:8787/health | jq
```

### PSBT via QR workflow

1. Place the unsigned PSBT in `~/portal/psbts/NAME.psbt`.
2. Run `~/portal/bin/psbt-to-qr ~/portal/psbts/NAME.psbt` to emit one or more PNG QR codes.
3. Transfer the QR images to the offline signer, scan them, and sign the PSBT.
4. Reassemble the signed PSBT with `~/portal/bin/qr-to-psbt ~/portal/psbts/NAME.signed.psbt <images...>`.
5. Broadcast or otherwise process the signed PSBT per existing runbooks.

### Tor hidden service health page

1. Ensure `~/portal/reports/health.html` has been generated (via the existing `portal-health` job).
2. Create the Tor hidden service drop-in configuration:
   ```bash
   sudo mkdir -p /var/lib/tor/portal-health
   sudo chown -R debian-tor:debian-tor /var/lib/tor/portal-health
   sudo chmod 700 /var/lib/tor/portal-health
   sudo mkdir -p /etc/tor/torrc.d
   sudo tee /etc/tor/torrc.d/portal-health.conf > /dev/null <<'TORC'
   HiddenServiceDir /var/lib/tor/portal-health
   HiddenServiceVersion 3
   HiddenServicePort 80 127.0.0.1:8088
   TORC
   if ! grep -q '^%include /etc/tor/torrc.d/*' /etc/tor/torrc; then
     echo '%include /etc/tor/torrc.d/*' | sudo tee -a /etc/tor/torrc
   fi
   sudo systemctl restart tor
   ```
3. Launch the helper: `~/portal/bin/portal-health-tor`.
4. Share the printed onion URL with authorized readers; the static server binds only to localhost, so the page is exposed exclusively via Tor.

## Hardening checklist

```bash
chmod 700 /home/pi/portal
chmod -R go-rwx /home/pi/portal/{configs,proofs,psbts,audits,logs,reports}
find /home/pi/portal -type f -name '*.psbt*' -exec chmod 600 {} +
find /home/pi/portal -type f -name '*.json' -exec chmod 600 {} +
```

These commands preserve key safety and keep the Tor-published health data limited to non-sensitive metadata.
