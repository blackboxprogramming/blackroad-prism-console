# TLS & Remote Access

## Modes
- **HTTP only** (default) — LAN only
- **Self-signed TLS** — HTTPS on LAN: kiosk-friendly
- **Cloudflare Tunnel** — Public HTTPS with no port-forward

## Self-signed TLS
1) Generate certs (on Pi):
```
sudo /opt/blackroad/os/tls/generate-selfsigned.sh pi.local
```
2) Set in `.env`:
```
ENABLE_TLS=selfsigned
BLACKROAD_DOMAIN=pi.local
```
3) Restart:
```
/opt/blackroad/os/brctl tls on
```
4) Browse `https://pi.local` (accept the warning) or install the cert in your trust store.

## Cloudflare Tunnel
1) Create a tunnel in Cloudflare Dashboard → “Use a token”.  
2) Put the token into `/opt/blackroad/os/docker/.env`:
```
CF_TUNNEL_TOKEN=xxxxx
```
3) Start:
```
/opt/blackroad/os/brctl tunnel on
```
4) Use the Cloudflare hostname (e.g., `https://blackroad.yourdomain.com`)

### Notes
- You can run both: LAN self-signed + public via Cloudflare.
- For *real* certs with public DNS + port 80/443, uncomment ACME in Traefik (see below).

## Optional: Let's Encrypt (public DNS)
In `reverse-proxy`, add (commented by default):
```
# - "--certificatesresolvers.le.acme.email=you@example.com"
# - "--certificatesresolvers.le.acme.storage=/certs/acme.json"
# - "--certificatesresolvers.le.acme.httpchallenge=true"
# - "--certificatesresolvers.le.acme.httpchallenge.entrypoint=web"
```
And add to each router label:
```
# - traefik.http.routers.<name>.tls.certresolver=le
```
Then forward ports 80/443 from your router to the Pi.
