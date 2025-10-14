# DigitalOcean DNS Records Runbook

This runbook codifies how to point the BlackRoad domains to the production droplet in DigitalOcean.
Use it whenever you need to audit, create, or repair DNS records for `blackroadinc.us` (operations
hub) and `blackroad.io` (products site).

## 1. Prerequisites

- Access to the DigitalOcean control panel with permission to manage Networking → Domains.
- The droplet **codex-infinity** (NYC3) online at the static IP **159.65.43.12**.
- Command-line alternative: [`doctl`](https://docs.digitalocean.com/reference/doctl/how-to/install/)
  authenticated with an API token that has domain write access (for automation).

> **Note:** `shellfish-droplet` (174.138.44.45) is reserved for legacy workloads. Keep DNS for the
> public websites pointed at `codex-infinity` unless an incident response plan dictates otherwise.

## 2. Required Records

Create or verify the following records for each domain. `TTL` should remain at **600 seconds** during
changes; raise to 3600 once stable.

### blackroadinc.us

| Type | Hostname | Value              | Purpose                    |
|------|----------|--------------------|----------------------------|
| A    | `@`      | `159.65.43.12`     | Primary site (Hub)         |
| A    | `*`      | `159.65.43.12`     | Wildcard fallback          |
| CNAME| `www`    | `@`                | Legacy `www` traffic       |
| TXT  | Existing | keep as-is         | GitHub + OpenAI validation |

### blackroad.io

| Type | Hostname | Value              | Purpose                       |
|------|----------|--------------------|-------------------------------|
| A    | `@`      | `159.65.43.12`     | Primary products site        |
| A    | `*`      | `159.65.43.12`     | Wildcard fallback            |
| CNAME| `www`    | `@`                | `www.blackroad.io` support   |
| A    | `lucidia`| `159.65.43.12`     | Lucidia landing (existing)   |
| TXT/CAA| Existing| keep as-is        | Verification + CA policy     |

> Remove duplicate records with identical type, host, and value to avoid UI clutter. The DO API
> tolerates duplicates, but the control panel surfaces them as separate lines which can confuse
> future audits.

## 3. DigitalOcean UI Steps

1. Navigate to **Networking → Domains → blackroadinc.us**.
2. Use **Create record** → **A record** with host `@`, select the droplet `codex-infinity` (or enter
   `159.65.43.12`), TTL `600`, then save.
3. Repeat for host `*` (wildcard) with the same IP. DigitalOcean will warn if it already exists—if so,
   confirm the value matches and skip recreation.
4. Create a **CNAME record** for host `www` pointing to `@`.
5. Review existing TXT records (`_github-pages-challenge-*`, `openai-domain-verification`) and leave
   untouched—they support GitHub and OpenAI verification flows.
6. Switch to **blackroad.io** and mirror steps 2–4. Ensure `lucidia.blackroad.io` remains an A record
   pointing to `159.65.43.12`.
7. After edits, click the gear icon on each record to confirm TTLs and values. Delete duplicates if you
   see multiple identical entries.

Propagation usually completes within a few minutes because TTL is low. Allow up to 10 minutes before
validation.

## 4. CLI Automation (Optional)

If you prefer automation or need to enforce records programmatically, use the helper script already in
this repository:

```bash
$ ./ops/do/dns_apply.sh 159.65.43.12
```

The script idempotently creates the `@`, `*`, and `www` records for both domains. It uses `doctl` under
 the hood; install it and run `doctl auth init` beforehand. Omitting the IP defaults to `159.65.43.12`.

## 5. Verification Checklist

Run these commands from a terminal after updates propagate:

```bash
# Resolve the root domains from a public resolver
$ dig +short blackroadinc.us @1.1.1.1
159.65.43.12
$ dig +short blackroad.io @1.1.1.1
159.65.43.12

# Check the www hostnames
$ dig +short www.blackroadinc.us @1.1.1.1
blackroadinc.us.
$ dig +short www.blackroad.io @1.1.1.1
blackroad.io.

# Confirm HTTP responses (expect 200 or redirect)
$ curl -I https://blackroadinc.us
$ curl -I https://www.blackroadinc.us
$ curl -I https://blackroad.io
$ curl -I https://www.blackroad.io
```

Capture the `dig` output in the change ticket or incident report for auditability.

## 6. Troubleshooting

- **Record exists but traffic still reaches the old host** → Clear CDN caches (Cloudflare if enabled),
  wait for TTL expiry, and verify there are no extra records at the registrar or another DNS provider.
- **DigitalOcean UI refuses a record** → Delete conflicting duplicates (e.g., both A and CNAME with the
  same host) before recreating.
- **`dig` works but HTTP fails** → Log into the droplet and validate Nginx is serving the site; check
  firewall rules and TLS certificates under `ops/tls/` runbooks.
- **Need temporary rollback** → Change only the `@` A record back to the previous IP (174.138.44.45),
  note it in the incident channel, and schedule a follow-up to re-point to `159.65.43.12` once resolved.

With this checklist, you can confidently keep both domains aligned to the production droplet and provide
an audit trail for future compliance reviews.
