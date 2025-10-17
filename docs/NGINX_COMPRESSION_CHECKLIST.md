# NGINX TLS Compression Checklist

This runbook captures the end-to-end checks for verifying gzip (and optional Brotli) support when NGINX terminates TLS. It is formatted as a copy-pasteable sequence you can run top-to-bottom on bare metal or inside Docker.

> Replace `YOUR.DOMAIN` and `/PATH` (or `/asset.js`) with real values before executing the commands.

---

## 1. Validate gzip over TLS

### Quick inspection (no config changes yet)

```bash
# Expect: Content-Encoding: gzip (or br once Brotli is enabled)
curl -sI --http2 -H 'Accept-Encoding: gzip' https://YOUR.DOMAIN \
  | sed -n '1p;/^content-encoding:/Ip;/^content-type:/Ip;/^vary:/Ip;/^cache-control:/Ip'

# Control test: no Accept-Encoding (should be uncompressed)
curl -sI --http2 https://YOUR.DOMAIN \
  | sed -n '1p;/^content-encoding:/Ip;/^content-length:/Ip'
```

### Minimal, safe gzip config

Add the following snippet to `/etc/nginx/conf.d/gzip.conf` (or inside the `http {}` block):

```nginx
gzip on;
gzip_comp_level 5;                 # 1–9; 5 is a good tradeoff
gzip_min_length 1024;
gzip_vary on;                      # send Vary: Accept-Encoding
gzip_proxied any;
gzip_types
  text/plain text/css text/xml application/xml application/json
  application/javascript application/x-javascript application/rss+xml
  application/atom+xml image/svg+xml font/woff2;
# Don't compress already compressed types
gzip_disable "msie6";
```

Reload and re-test:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Check payload sizes:

```bash
curl -s --http2 -H 'Accept-Encoding: gzip' https://YOUR.DOMAIN/PATH | wc -c
curl -s --http2 https://YOUR.DOMAIN/PATH | wc -c
```

---

## 2. Verify TLS certificates (Certbot)

```bash
# Show presented certificate chain & SNI
openssl s_client -connect YOUR.DOMAIN:443 -servername YOUR.DOMAIN -brief </dev/null \
  | sed -n '1,20p'

# Confirm nginx is serving the expected certificate
sudo nginx -T | sed -n '/server_name YOUR.DOMAIN/,/}/p' \
  | sed -n '/ssl_certificate/p;/ssl_certificate_key/p'

# Check certbot status and perform a dry-run renewal
sudo certbot certificates
sudo certbot renew --dry-run
```

If nginx runs under Docker Compose:

```bash
docker compose exec nginx nginx -T | sed -n '/ssl_certificate/p;/server_name/p'
docker compose logs -f nginx
```

---

## 3. Pre-compressed asset workflow

Generate `.gz` and `.br` assets from your web root or build output directory:

```bash
find . -type f -regex '.*\.(html|css|js|json|svg|xml|txt|woff2)$' \
  -not -name '*.gz' -not -name '*.br' \
  -print0 | xargs -0 -I{} sh -c '
  gzip -9 -c "{}" > "{}".gz
  brotli -f -q 11 "{}" -o "{}".br
'
```

NGINX config to serve the static payloads:

```nginx
gzip_static on;              # serve file.gz when Accept-Encoding: gzip

# Enable Brotli if the module is available
brotli on;
brotli_comp_level 5;
brotli_static on;            # serve file.br when available
brotli_types
  text/plain text/css text/xml application/xml application/json
  application/javascript application/rss+xml application/atom+xml
  image/svg+xml font/woff2;

# Strong caching for static assets (adjust the path/patterns)
location ~* \.(css|js|woff2|svg|json)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
  try_files $uri $uri.br $uri.gz =404;
}
```

Re-run the header checks:

```bash
# Expect Content-Encoding: br if the client advertises br; fallback to gzip
curl -sI --http2 -H 'Accept-Encoding: br,gzip' https://YOUR.DOMAIN/asset.js \
  | sed -n '1p;/^content-encoding:/Ip;/^content-length:/Ip'
```

---

## 4. Application compatibility checks

Keep an eye on the headers passed to upstream services.

```bash
# PHP one-liner to confirm Accept-Encoding propagation (CLI)
php -r 'echo $_SERVER["HTTP_ACCEPT_ENCODING"] ?? "no header", PHP_EOL;'
```

If CLI prints the header but PHP-FPM does not, drop in a temporary endpoint:

```php
<?php
header('Content-Type: text/plain');
echo $_SERVER['HTTP_ACCEPT_ENCODING'] ?? "no header";
```

Test via curl:

```bash
curl -s https://YOUR.DOMAIN/test-accept-encoding.php -H 'Accept-Encoding: br,gzip'
```

Confirm `fastcgi_params` preserves the header:

```nginx
location ~ \.php$ {
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_pass unix:/run/php/php-fpm.sock;
}
```

Guard sensitive routes:

```nginx
location ^~ /login { gzip off; brotli off; }
location ^~ /account { gzip off; brotli off; }
```

---

## 5. Docker and CI-specific checks

```bash
# Verify gzip/Brotli modules are compiled in
docker compose exec nginx nginx -V 2>&1 | tr ' ' '\n' | grep -Ei 'ngx_http_gzip|brotli'

docker compose exec nginx gzip --version
docker compose exec nginx brotli --version

# Bypass TLS by curling inside the network
docker compose exec app curl -sI -H 'Accept-Encoding: gzip' http://nginx:80/ \
  | sed -n '1p;/^content-encoding:/Ip'

docker compose logs -f nginx
```

Optionally add `$gzip_ratio` to your `log_format` to observe savings:

```nginx
log_format main '$remote_addr - $remote_user [$time_local] '
                '"$request" $status $body_bytes_sent '
                '"$http_referer" "$http_user_agent" $gzip_ratio';
```

---

## 6. Enabling Brotli (optional)

If your NGINX build lacks Brotli support:

- Debian/Ubuntu: install a package that bundles `ngx_brotli` (e.g., the official `extras` builds) or compile a custom build.
- Alpine/Docker: use an image that ships with Brotli enabled or extend your Dockerfile to add the module.

Brotli generally yields smaller text payloads than gzip at comparable CPU cost, especially when serving static `.br` artifacts.

---

## 7. Success criteria

- **TLS:** `certbot renew --dry-run` succeeds and `openssl s_client` shows a valid chain with correct SNI.
- **Negotiation:** `Content-Encoding` is `br` or `gzip` when requested and absent otherwise.
- **Caching:** Static assets include `Cache-Control: public, max-age=31536000, immutable` and omit `Set-Cookie`.
- **Vary:** `Vary: Accept-Encoding` is present on compressed responses.
- **Size wins:** Compressed responses are significantly smaller than uncompressed payloads.
- **Safety:** Login/account (and other sensitive) routes stay uncompressed.

---

## 8. Stack details to surface when requesting help

When escalating or asking for a review, capture the following:

- Bare metal vs. Docker (include image + tag for NGINX).
- Output from `nginx -V`.
- One representative domain/path to probe.
- Whether you rely on dynamic compression, static assets, or both.
