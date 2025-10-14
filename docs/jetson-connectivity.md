# Jetson connectivity fixes

The dashboard shells against the Jetson over SSH. If name resolution for
`jetson.local` fails, the backend falls back to that hostname and all commands
error with `could not resolve hostname jetson.local`.

Use one of the following approaches to point the backend at the right device.

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

## 3. Discover the Jetson over Ethernet

If you have physical Ethernet connected to the same switch/VLAN, the agent can
scan the subnet and highlight any Jetson-class boards it finds.

1. Open the local agent dashboard and press **Scan LAN**. The table is populated
   directly from `GET /discover/scan`, so you can also query it via curl:

   ```sh
   curl -s http://localhost:8080/discover/scan | jq '.hosts[] | select(.kind=="jetson")'
   ```

2. Each entry includes the IP, any mDNS hostname discovered, and whether SSH is
   reachable. Click **Set as target** (or POST to `/discover/set`) to update the
   configured Jetson for subsequent commands.

Behind the scenes the scan walks the local /24, pings each host, resolves
mDNS/DNS names, and attempts SSH handshakes as the `jetson`, `ubuntu`, and
`nvidia` users. Hosts that respond and expose NVIDIA GPU telemetry are marked as
`kind: "jetson"`, making it easy to pick the right IP after a fresh Ethernet
install.
