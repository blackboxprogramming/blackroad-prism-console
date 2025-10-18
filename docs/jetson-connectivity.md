# Jetson connectivity fixes

The dashboard shells against the Jetson over SSH. If name resolution for
`jetson.local` fails, the backend falls back to that hostname and all commands
error with `could not resolve hostname jetson.local`.

Use the discovery helper below or one of the manual approaches to point the
backend at the right device.

## 0. Discover the Jetson on a wired link

When the Jetson is tethered over Ethernet (e.g., directly to a Pi 400) the DHCP
range is often limited to a small /24. You can scan it from the controller:

```sh
cd /workspace/blackroad-prism-console
python -m agent.discover
```

If multiple interfaces are up, set `BLACKROAD_DISCOVER_IFACE` to pick the
Ethernet device (for example `enx00e04c123456`). The output lists the hosts that
respond to ping/SSH and flags the Jetson automatically.

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
