# BlackRoad Infrastructure Inventory

This quick-reference note collects the assets that keep the BlackRoad stack online and points to the existing runbooks for deeper steps. Use it as the single place to start when you need to locate hardware, domains, or supporting services quickly.

## DigitalOcean footprint

| Resource | Details | Linked procedures |
| --- | --- | --- |
| **Primary droplet** | Public IP `159.65.43.12`; private VPC IP `10.108.0.2`. Hosts production workloads and the Gitea/front-end stack. | SSH + Git sync workflow (`docs/github-droplet-sync.md`), deploy helpers (`ops/bluegreen_deploy.sh`, `blackroad-foundation/scripts/deploy_to_droplet.sh`).
| **DNS automation** | `ops/do/dns_apply.sh` seeds A/CNAME records that point `blackroad.io` and `blackroadinc.us` to the droplet IP. | DigitalOcean domain provisioning script (`ops/do/dns_apply.sh`).

- Confirm the droplet fingerprint before pushing: `SHA256:b3uikwBkwnxpMTZjWBFaNgscsWXHRRG3Snj9QYke+ok=` (see `secrets/hosts.json`).
- The droplet host/IP also appears in `secrets/droplet.env.example`; keep the actual `.env` outside version control as documented in `secrets/README.md`.

## Domains and web properties

- **blackroad.io** – Serves the public product presence and the Gitea entry point referenced in the main runbook. The zone is provisioned for NSD via `provision/40_dns_auth.sh` and the repository `CNAME` file pins `www.blackroad.io` to the apex.
- **blackroadinc.us** – Operations hub used for SSO, policies, finance, and investor relations. See `docs/blackroad-ops-day-one.md` for the subdomain map and `docs/blackroad_ops_execution_plan.md` for roll-out tasks. nginx/certbot configs expect the domain bundle (`nginx/conf.d/lucidia-sites.conf`, `ops/tls/certbot_issue_or_renew.sh`).
- **Portal suite** – Social graph (“friends”), chat, and other portal surfaces are planned under the multi-portal implementation roadmap rather than existing infrastructure. Start with `docs/portal-suite-plan.md` for scope and data ownership before hunting for missing content.

## Working Copy and iOS/WebDAV mirrors

- Working Copy automation is stubbed throughout the sync scripts (`docs/github-droplet-sync.md`, `scripts/blackroad_sync.sh`). Use these to refresh iOS mirrors after confirming the WebDAV endpoint.
- WebDAV endpoint for manual sync: `http://192.168.4.55:8080/` (Working Copy server). Record the credential location alongside your password manager entry; this repo intentionally stores only the endpoint.
- Combined WebDAV + device check: run `./scripts/webdav_device_check.sh` to confirm the Working Copy server responds **and** that the Jetson/Pi hosts still accept SSH.
- If the iOS mirror falls behind, update `WORKING_COPY_PATH`/`WORKING_COPY_DEVICES` per the sync guide and rerun the refresh step to pull from GitHub and redeploy to the droplet.

## Raspberry Pi network

- Devices `lucidia@pi` and `alice@raspberrypi` are part of the three-node dev mesh documented in the Raspberry Pi playbook. Follow the hostname/IP recording, SSH key exchange, and connectivity verification steps there (`docs/pi-network-setup.md`).
- Run `scripts/pi_network_check.sh` from this repo to ping and SSH into each host; add arguments for additional machines. The helper warns when passwordless auth or ICMP reachability fails.
- For remote access from macOS/iOS, the remote access quickstart expands on SSH config shortcuts and troubleshooting tactics (`docs/remote-access-guide.md`).

## Open items & next actions

1. **Pi display assets:** confirm that the hologram and dashboard stacks receive the latest artwork by replaying the deployment scripts in `docs/pi/`. Capture new snapshots once the assets match expectations.
2. **“117 friends” data:** align with the portal suite roadmap to define the social graph seed data before investigating missing contacts. Track implementation in the BackRoad Social milestones.
3. **Slack/Jira/Asana connectivity:** the sync scripts currently stub these integrations. File issues against `docs/blackroad_ops_execution_plan.md` tasks to re-enable the connectors if they remain offline.

Keep this document updated whenever infrastructure endpoints move or new services come online so the next responder can triage without guesswork.
