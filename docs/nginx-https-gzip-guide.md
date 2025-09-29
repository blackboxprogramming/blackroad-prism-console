# Nginx HTTPS + Gzip Quickstart

This guide captures a minimal configuration and workflow for deploying an Nginx origin that speaks HTTPS and compresses text assets with gzip. It mirrors the approach outlined in the latest infrastructure review so you can reproduce it on any VM, bare-metal box, or container runtime.

## 1. Prerequisites

- Ubuntu 20.04+ or another distribution with Nginx packages
- Root or sudo access
- DNS A/AAAA records for `example.com` (replace with your domain) pointing at the host
- Ports 80 and 443 allowed through local firewalls and cloud security groups

## 2. Minimal site configuration

Save the following as `/etc/nginx/sites-available/example.conf` and symlink it into `sites-enabled`. Adjust the domain and certificate paths for your environment.

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    # Redirect all http to https
    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    # TLS certs (let certbot or your CA populate these paths)
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Basic TLS hardening (Mozilla intermediate-ish)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # Optional: HSTS (enable after you confirm HTTPS works)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    root /var/www/example;
    index index.html;

    # GZIP settings
    gzip on;
    gzip_http_version 1.1;
    gzip_comp_level 6;                 # 1-9 (higher = more CPU, smaller size)
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript
        image/svg+xml;
    # Optionally serve precompressed (.gz) files
    gzip_static on;  # requires precompressed files like file.js.gz available

    # Cache headers for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri =404;
    }

    # API / app endpoints
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Optional Docker Compose wrapper

If you prefer to containerise the setup, drop the config above into `./nginx/conf.d/example.conf`, host your web root in `./site`, mount your certificate directory into `./certs`, and launch with this compose file:

```yaml
version: "3.8"
services:
  nginx:
    image: nginx:stable
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./site:/var/www/example:ro
      - ./certs:/etc/letsencrypt:ro
    restart: unless-stopped
```

## 3. Issue TLS certificates

On the host, install Certbot and request certificates for your domain:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d example.com -d www.example.com
```

When using Docker, run Certbot on the host or in a sidecar with the webroot or DNS challenge. Ensure the resulting `/etc/letsencrypt/` directory is mounted read-only into the Nginx container.

## 4. Validating compression, TLS, and caching

### Manual checks

```bash
# Fetch headers with gzip enabled and let curl decompress automatically
curl -s --compressed -D - https://example.com/path/to/file.js -o /dev/null

# Download the compressed bytes to inspect with `file`
curl -s -H "Accept-Encoding: gzip" --raw https://example.com/path/to/file.js --output compressed.bin
file compressed.bin

# Inspect negotiated TLS parameters
openssl s_client -connect example.com:443 -servername example.com </dev/null | sed -n '1,120p'

# Alternative TLS view via curl
curl -vI https://example.com 2>&1 | sed -n '1,120p'
```

Check for these headers:

- `Content-Encoding: gzip` confirms compression
- `Vary: Accept-Encoding` keeps caches honest
- `Cache-Control` and `Expires` show static asset caching behaviour
- `Strict-Transport-Security` indicates HSTS is active (only enable after verification)

### Automated reporting helper

Use the companion script added in `scripts/check_nginx_compression.sh` to sample multiple endpoints:

```bash
# Pass URLs directly
./scripts/check_nginx_compression.sh https://example.com/index.html https://example.com/app.js

# Or provide a file with one URL per line (comments allowed)
./scripts/check_nginx_compression.sh -f urls.txt
```

The script prints HTTP status, cache headers, negotiated TLS version, and content-encoding details for each endpoint, making it easy to log your verification runs.

## 5. Optional: enable Brotli

If your Nginx build includes `ngx_brotli`, append:

```nginx
brotli on;
brotli_comp_level 5;
brotli_types text/plain text/css application/javascript application/json image/svg+xml;
```

Pre-compressing `.br` assets during your build pipeline delivers even better ratios while keeping runtime CPU usage low.

## 6. Troubleshooting quick hits

- Verify DNS and firewall rules before running Certbot.
- Confirm the certificate paths listed in the server block exist after issuance.
- Ensure files exceed `gzip_min_length` (256 bytes by default) to trigger compression.
- When behind another proxy or CDN, test against the origin directly to rule out intermediary behaviour.
- Monitor CPU usage after raising `gzip_comp_level` or enabling Brotli to avoid saturating the host.
