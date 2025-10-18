# Jetson connectivity fixes

The dashboard shells against the Jetson over SSH. If name resolution for
`jetson.local` fails, the backend falls back to that hostname and all commands
error with `could not resolve hostname jetson.local`.

Use one of the following approaches to point the backend at the right device.

## 0. Discover the Jetson's address (optional)

If you are unsure where the Jetson lives on the network, run the helper to
locate it. The script probes common hostnames (`jetson.local`, `jetson-01`,
etc.) and can sweep the LAN for SSH endpoints that report Jetson/Tegra
metadata:

```sh
./scripts/find_jetson.py
```

When the Jetson responds, the script prints `[FOUND] host: ...` with the first
line of `/etc/nv_tegra_release`. Provide `--host` or `--subnet` to check custom
targets or broader address ranges. The helper autodetects active IPv4 networks
via `ip` on Linux or `ifconfig` on macOS and sweeps them in parallel (16 worker
threads by default) so larger subnets complete quickly even over flaky Wi-Fi.
Tune concurrency with `--workers` or set `--skip-scan` to avoid subnet sweeps
when you only want to test explicit hostnames.

## 1. Host override (quick workaround)

Append a static mapping for the Jetson into `/etc/hosts` on the controller:

```sh
sudo tee -a /etc/hosts <<'HOSTS'
192.168.4.23   jetson.local jetson
HOSTS
```

Verify the mapping immediately:

```sh
ssh jetson@jetson.local uptime
```

Once the test succeeds the dashboard streams start working without further
changes.

## 2. Configure the services (recommended)

The dashboard, API, and agent processes read `JETSON_HOST` and `JETSON_USER` at
startup. Set them via drop-in units so the services track the correct IP even if
`.local` discovery breaks:

```sh
sudo systemctl edit blackroad-dashboard.service
```

Add the overrides:

```
[Service]
Environment=JETSON_HOST=192.168.4.23
Environment=JETSON_USER=jetson
```

Repeat for `blackroad-api.service` and `blackroad-agent.service`, then reload the
units:

```sh
sudo systemctl daemon-reload
sudo systemctl restart blackroad-dashboard blackroad-api blackroad-agent
```

Finally confirm the connectivity from the console:

```sh
blackroad status
```

When the Jetson responds the "Run (stream)" widget will emit the live
`nvidia-smi` output instead of resolution failures.
