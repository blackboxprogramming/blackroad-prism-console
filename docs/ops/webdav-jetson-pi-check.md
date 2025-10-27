# WebDAV + Jetson/Pi connectivity check

Use this checklist when you need to confirm that the Working Copy WebDAV mirror
is reachable without breaking SSH connectivity to the Jetson and Raspberry Pi
devices on the lab network.

## 1. Verify the WebDAV endpoint

1. Confirm the expected endpoint from the infrastructure inventory: the default
   Working Copy server listens on `http://192.168.4.55:8080/`.
2. Run the combined health check script (see below). It pings the host and sends
   a `PROPFIND` request to make sure the WebDAV service is responding.
3. If the check fails, restart or reseat the Working Copy host, then re-run the
   script until you receive `[OK]` for both the ping and the WebDAV request.

## 2. Validate Jetson and Pi connectivity

1. Keep the Jetson on a wired link where possible so `jetson.local` resolves
   predictably. If you have a static override from `docs/jetson-connectivity.md`
   follow it before continuing.
2. Ensure the Raspberry Pi hosts listed in `scripts/pi_network_check.sh` still
   respond to ping and passwordless SSH.
3. The combined health check script runs these validations for you; if a device
   fails ping or SSH, fix the underlying network or key exchange before moving
   on (restart services, re-add `~/.ssh/known_hosts`, etc.).

## 3. Run the combined health check script

```sh
./scripts/webdav_device_check.sh
```

- Default WebDAV endpoint: `http://192.168.4.55:8080/`
- Default Jetson target: `jetson@jetson.local`
- Default Pi targets: `lucidia@pi`, `alice@raspberrypi`

Override any of these on the fly:

```sh
WEBDAV_URL=http://192.168.4.23:3000/ \
JETSON_HOST=jetson@192.168.4.23 \
./scripts/webdav_device_check.sh --pi-host lucidia@192.168.4.42 piops@192.168.4.44
```

The script exits non-zero when any check fails, making it easy to drop into
monitoring or CI jobs.

## 4. Follow-up when checks fail

- **WebDAV down**: cross-reference the Working Copy runbooks (`docs/github-
  droplet-sync.md`, `scripts/blackroad_sync.sh`) and restart the sync host.
- **Jetson unreachable**: fall back to the manual overrides from
  `docs/jetson-connectivity.md` and verify SSH keys.
- **Pi unreachable**: refresh the Raspberry Pi playbook (`docs/pi-network-setup.md`)
  to redo host discovery and key exchange.

Document any permanent IP or hostname changes back in
`docs/ops/infrastructure-inventory.md` so future responders have the current map.
