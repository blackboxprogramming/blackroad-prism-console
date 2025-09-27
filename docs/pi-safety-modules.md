# Raspberry Pi Safety Modules

The repository now includes artefacts to deploy three "learn-mode" services on a
low-power Raspberry Pi that already runs a Bitcoin Core node. Each component is
opt-in and designed to stay private by default.

## 1. Core Lightning sidecar

* File: [`compose/btc-lightning.yml`](../compose/btc-lightning.yml)
* Adds a Core Lightning daemon (`cln`) next to `bitcoind` without exposing
  public ports.
* Requires the existing Core container to share the Docker network.
* Provide `BITCOIN_RPCUSER` and `BITCOIN_RPCPASSWORD` via an `.env` file or
  shell environment before launching.

```bash
# bootstrap from the repository root on the Pi
cp compose/btc-lightning.yml ~/btc-compose.yml
cat <<'ENV' > ~/btc.env
BITCOIN_RPCUSER=bitcoin
BITCOIN_RPCPASSWORD=change_this_long_random_pw
ENV

docker compose -f ~/btc-compose.yml --env-file ~/btc.env up -d bitcoind cln
```

* Check the node status when Core is synced:

```bash
docker compose -f ~/btc-compose.yml --env-file ~/btc.env exec cln lightning-cli getinfo
```

## 2. XMRig learn-mode miner

* File: [`systemd/xmrig-learn.service`](../systemd/xmrig-learn.service)
* Runs XMRig with `nice`, CPU quotas, and strict systemd sandboxing.
* Install XMRig once (throttled build flags keep dependencies minimal):

```bash
sudo apt update
sudo apt install -y build-essential cmake git libuv1-dev libssl-dev libhwloc-dev
cd ~ && git clone https://github.com/xmrig/xmrig.git
cd xmrig && mkdir build && cd build
cmake .. -DWITH_HWLOC=OFF -DWITH_HTTPD=OFF
make -j2
```

* Configure `/etc/default/xmrig` (owned by root) so the unit never stores pool
  secrets directly:

```bash
sudo install -m 600 /dev/null /etc/default/xmrig
sudo tee /etc/default/xmrig >/dev/null <<'ENV'
XMRIG_POOL_HOST=POOL_HOST:PORT
XMRIG_ADDRESS=YOUR_XMR_ADDRESS
XMRIG_THREADS_HINT=1
XMRIG_CPU_QUOTA=25%
XMRIG_EXTRA_ARGS=--randomx-mode=light
ENV
```

* Enable the unit:

```bash
sudo cp systemd/xmrig-learn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now xmrig-learn.service
sudo systemctl status xmrig-learn --no-pager
```

Lower `XMRIG_CPU_QUOTA` or `XMRIG_THREADS_HINT` for quieter operation.

## 3. Masked address health reporter

* File: [`scripts/addr-health.mjs`](../scripts/addr-health.mjs)
* Emits a masked + digested view of configured addresses and appends the
  results to a local log.
* Configure `/etc/default/addr-health` with the variable names and values you
  want the script to read:

```bash
sudo install -m 600 /dev/null /etc/default/addr-health
sudo tee /etc/default/addr-health >/dev/null <<'ENV'
ADDRESS_NAMES=ROBINHOOD_ETHEREUM,ROBINHOOD_BITCOIN,COINBASE_BITCOIN,VENMO_LITECOIN
ROBINHOOD_ETHEREUM=0x...
ROBINHOOD_BITCOIN=bc1...
COINBASE_BITCOIN=3...
VENMO_LITECOIN=ltc1...
ADDR_HEALTH_LOG=/home/pi/addr-health.log
ENV
```

* Add a cron entry that loads the environment file and runs nightly:

```bash
( crontab -l 2>/dev/null ; \
  echo "17 2 * * * . /etc/default/addr-health; /usr/bin/env -i bash -lc 'node ~/repo/scripts/addr-health.mjs' >/dev/null 2>&1" \
) | crontab -
```

  * Adjust the repository path (`~/repo`) to match where this project lives on
    the Pi.

* View the latest log entry:

```bash
tail -n 50 /home/pi/addr-health.log
```

### Optional agent endpoint

If you run the Node 20 agent included in this repository, expose the latest log
via HTTP so remote operators can fetch it safely:

```ts
if (req.url === '/addresses/local-report') {
  const fs = require('node:fs');
  const path = process.env.ADDR_HEALTH_LOG || '/home/pi/addr-health.log';
  let body = '';
  try {
    body = fs.readFileSync(path, 'utf8').split('\n').slice(-200).join('\n');
  } catch (error) {
    body = `no report yet: ${error.message}\n`;
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end(body || 'no report yet\n');
  return;
}
```

Restart the agent after adding the snippet, then fetch the report over a trusted
network (for example through Tailscale):

```bash
curl http://<tailscale-ip>:8080/addresses/local-report
```
