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
| `portal-help` | Display a help index of the major Portal commands and workflows. |
| `psbt-to-qr <file.psbt> [out.png]` | Encode a (signed or unsigned) PSBT into a QR image. Files larger than ~2500 base64 characters are split into numbered parts. |
| `qr-to-psbt <out.psbt> <img1.png> [img2.png ...]` | Reconstruct a PSBT from one or more QR images scanned on an offline machine. |
| `portal-static [addr:port]` | Serve `reports/health.html` over HTTP on localhost. Used internally by the Tor helper. |
| `portal-health-tor` | Print the Tor onion URL for the health page and launch the local static server on `127.0.0.1:8088`. |
| `psbt-fake-sign <label>` | Clone `<label>.psbt` to `<label>.signed.psbt` for offline signer simulations and automated tests. |

The new `portal-env` helper checks that `bitcoin-cli`, `jq`, and `python3` are available and that `configs/raw.descriptor` is populated. `portal-run` chains a descriptor proof, the health report generator, and the checklist builder for a single-command operations sweep. `portal-selftest` performs a key-safe smoke test that exercises PSBT creation and verification using the `psbt-fake-sign` shim, while `portal-help` prints a concise index of the most common workflows.

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
