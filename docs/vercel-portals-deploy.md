# Vercel Deploy Fixes & Nginx Split

## TL;DR – commands to "get Vercel on"

If you just need the exact commands, run this sequence from your terminal. Replace the email with the one that is already on your Vercel team, then rerun your production deploy:

```bash
git config --global user.name "Alexa Louise"
git config --global user.email "YOUR_REAL_EMAIL@EXAMPLE.COM"
npx vercel switch             # pick "Alexa Amundson's projects"
cd ~/blackroad-prism-console/apps/portals
npx vercel link               # select the existing project
npx vercel --prod --yes
```

The sections below explain why each step matters and how to troubleshoot if any command fails.

## Resolve "Git author you@example.com" errors

Vercel refuses deploys when the Git author on the commit does not match a member of the target team. Fix it locally, then re-deploy:

```bash
# 1. Align your local git identity with the Vercel team member email
git config --global user.name "Alexa Louise"
git config --global user.email "YOUR_REAL_EMAIL@EXAMPLE.COM"

# 2. Confirm the CLI scope matches the team you need
npx vercel whoami
npx vercel switch            # choose "Alexa Amundson's projects"

# 3. Link the repo directory to the right project
cd ~/blackroad-prism-console/apps/portals
npx vercel link              # select the existing project ("portals" or create "blackroad")

# 4. Deploy production
npx vercel --prod --yes
```

If the deploy still errors, double-check that the email configured in git is invited to the Vercel team. Either add the email under **Vercel → Settings → Members** or change the `git config --global user.email` to the address that already exists on the team.

## DNS + hosting split

Keep the marketing site on Vercel and route any backend services through your own infrastructure.

| Hostname            | Target                     |
|--------------------|----------------------------|
| `blackroad.io`      | Vercel production deploy   |
| `www.blackroad.io`  | `cname.vercel-dns.com` CNAME|
| `api.blackroad.io`  | Your server / load balancer|

## Minimal Nginx config for APIs

Use Nginx only for your API surface (for example, `api.blackroad.io`). The following template handles HTTP→HTTPS redirects, TLS, security headers, and proxying to an application on `localhost:4000`.

```nginx
# /etc/nginx/sites-available/api.blackroad.io
server {
  listen 80;
  server_name api.blackroad.io;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.blackroad.io;

  ssl_certificate     /etc/letsencrypt/live/api.blackroad.io/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.blackroad.io/privkey.pem;

  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header Referrer-Policy no-referrer-when-downgrade;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 300;
  }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/api.blackroad.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Point the `api.blackroad.io` DNS A record at your server IP. Leave `blackroad.io` and `www.blackroad.io` on Vercel so the portal loads directly from the managed Next.js hosting.
