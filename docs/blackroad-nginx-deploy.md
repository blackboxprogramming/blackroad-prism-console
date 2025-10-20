# BlackRoad Nginx Deployment Guide

This guide captures the quickest path to serve **blackroad.io** via Nginx on a Rocky/Alma/CentOS-based DigitalOcean droplet, point DNS in GoDaddy, and prepare for HTTPS via Let's Encrypt.

## Block A — Server setup (DigitalOcean console)

Run the following commands on the droplet:

```bash
# --- 0) Basics (Rocky/Alma/CentOS) ---
dnf -y install nginx

# --- 1) Web root + placeholder page ---
mkdir -p /var/www/blackroad
cat >/var/www/blackroad/index.html <<'HTML'
<!doctype html><meta charset="utf-8"><title>BlackRoad</title>
<style>body{margin:0;background:#060b18;color:#e6f0ff;font:16px/1.6 system-ui;display:grid;place-items:center;height:100vh}main{max-width:640px;padding:24px;text-align:center}</style>
<main><h1>BlackRoad is live</h1><p>Static deploy wired to Nginx. Content incoming.</p></main>
HTML

# --- 1a) SELinux context for the custom web root ---
if selinuxenabled; then
    dnf -y install policycoreutils-python-utils  # provides semanage on Rocky/Alma/CentOS
    semanage fcontext -a -t httpd_sys_content_t '/var/www/blackroad(/.*)?'
    restorecon -Rv /var/www/blackroad
fi

# --- 2) Nginx site config (HTTP first) ---
cat >/etc/nginx/conf.d/blackroad.conf <<'NGINX'
server {
    listen 80;
    server_name blackroad.io www.blackroad.io;

    root /var/www/blackroad;
    index index.html;

    location = /healthz {
        add_header Content-Type application/json;
        return 200 '{"ok":true,"service":"blackroad","ts":"$time_iso8601"}';
    }
}
NGINX

# --- 3) Start Nginx ---
nginx -t && systemctl enable --now nginx

# --- 4) Smoke test from the server ---
curl -sI http://127.0.0.1 | head -n1
curl -s http://127.0.0.1/healthz
```

Expect `HTTP/1.1 200 OK` from the first curl and the JSON payload from `/healthz` to confirm the service is responding.

If SELinux is enforcing (the default on Rocky/Alma/CentOS), the `selinuxenabled` block above relabels `/var/www/blackroad` so Nginx can read the files. Without the updated context the smoke test will return `403 Forbidden`.

## Block B — DNS (GoDaddy)

Update the DNS records for **blackroad.io**:

- `A @` → `174.138.44.45` (TTL 600)
- `A www` → `174.138.44.45` (TTL 600)

Once propagation starts, verify from your local machine:

```bash
dig +short blackroad.io
dig +short www.blackroad.io
```

Both should resolve to `174.138.44.45`.

## Optional — Enable HTTPS with Let's Encrypt

After DNS resolves to the droplet IP, request certificates and enable HTTPS:

```bash
# EPEL for certbot
dnf -y install epel-release
dnf -y install certbot python3-certbot-nginx || true

# If the above certbot install fails, use snap as fallback:
if ! command -v certbot >/dev/null; then
  dnf -y install snapd && systemctl enable --now snapd && ln -sf /var/lib/snapd/snap /snap
  snap install core && snap refresh core
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
fi

# Issue certs and enable HTTPS + redirect
certbot --nginx -d blackroad.io -d www.blackroad.io --redirect --agree-tos -m you@example.com --non-interactive

# Verify
curl -sI https://blackroad.io | head -n1
curl -s https://blackroad.io/healthz
```

Successful runs will show an `HTTP/2 200` status and the JSON payload over HTTPS.

## Deploying updated site files

When ready to push real content, sync your local site directory to the droplet:

```bash
# If SSH key login is configured
rsync -az SITE_DIR/ root@174.138.44.45:/var/www/blackroad/
ssh root@174.138.44.45 "nginx -t && systemctl reload nginx"
```

If key-based SSH is not yet configured, temporarily enable password login via the DigitalOcean console, SSH in once to add your key, and re-run the commands above.
```
