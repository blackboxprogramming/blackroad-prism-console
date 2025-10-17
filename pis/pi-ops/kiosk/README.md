# Pi-Ops Kiosk Bundle (v4)

This bundle ships the Pi-Ops kiosk configuration and a companion Grafana
layout. Copy this directory to the Pi alongside
`scripts/install_pi_ops_kiosk.sh`, then execute the installer from the Pi
user account:

```sh
scp -r pis/pi-ops/kiosk scripts/install_pi_ops_kiosk.sh pi@pi-ops.local:/home/pi/
ssh pi@pi-ops.local 'bash install_pi_ops_kiosk.sh'
```

After the installer completes, update `/etc/systemd/system/kiosk.service`
so that `GRAFANA_URL` points at your dashboard host (replace the
`MAC_OR_IP_PLACEHOLDER` value), reload systemd, and start the kiosk
service:

```sh
sudo nano /etc/systemd/system/kiosk.service
sudo systemctl daemon-reload
sudo systemctl restart kiosk
```

## Contents

- `grafana/pi_ops_ultra.json` — Ultrawide Grafana dashboard exported with
  the stable UID `pi-ops-ultra`. Import it on the Mac/host Grafana so the
  kiosk URL remains predictable.
- `bin/pi_ops_kiosk_session.sh` — Launches Chromium in fullscreen kiosk
  mode with blanking disabled and cursor hidden.
- `systemd/kiosk.service` — Systemd unit pre-wired for the kiosk session
  (edit the Grafana URL before enabling).
- `systemd/getty-autologin.conf` — Optional drop-in to auto-login the
  `pi` user on tty1.
- `xinitrc` — Minimal X session that calls the kiosk launcher.

All files are designed to be installed by
`scripts/install_pi_ops_kiosk.sh`.
