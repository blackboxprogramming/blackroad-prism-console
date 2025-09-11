#!/usr/bin/env bash
set -euo pipefail

# === EDIT THIS ONE LINE ===
GH_REPO="blackboxprogramming/blackroad-website"   # your GitHub repo "owner/name"

# Create working dir
mkdir -p blackroad-website && cd blackroad-website

# Files
mkdir -p .github/workflows

# CNAME ensures your custom domain works
cat > CNAME <<'TXT'
blackroad.io
TXT

# Health file (can be checked by anyone)
cat > health.json <<'JSON'
{"status":"ok","service":"blackroad.io","timestamp":"${BUILD_TIME:-manual}"}
JSON

# Basic SPA router fallback so /login, /chat, etc. don’t 404 on Pages
cat > 404.html <<'HTML'
<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/">
<script>location.replace("/");</script>
HTML

# One-file site (routes inside). Brand colors are included.
cat > index.html <<'HTML'
<!-- FILE: /index.html -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BlackRoad.io — Live</title>
  <style>
    :root{--accent:#FF4FD8;--accent2:#0096FF;--accent3:#FDBA2D;--bg:#0b0b12;--fg:#eaeaf2;--muted:#a0a3ad}
    *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,Segoe UI,Roboto,Inter,sans-serif}
    header{padding:24px 16px;border-bottom:1px solid #1c1f2a;background:linear-gradient(180deg,rgba(255,79,216,.08),transparent)}
    .wrap{max-width:1100px;margin:0 auto;padding:24px 16px}
    h1{margin:0 0 6px;font-size:28px}
    .pill{display:inline-block;padding:6px 10px;border:1px solid #272a38;border-radius:999px;color:var(--muted)}
    nav{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
    a.btn{display:inline-block;text-decoration:none;border:1px solid #272a38;border-radius:14px;padding:10px 14px}
    a.primary{border-color:transparent;background:linear-gradient(90deg,var(--accent),var(--accent2));color:#0b0b12;font-weight:700}
    .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
    .card{border:1px solid #1e2230;border-radius:18px;padding:16px;background:#0e111b;box-shadow:0 0 0 1px rgba(255,255,255,.02) inset}
    .tag{font-size:12px;color:var(--muted)}
    footer{padding:24px 16px;border-top:1px solid #1c1f2a;color:var(--muted)}
    .ok{color:#5dffa7}.warn{color:#ffdd6b}.bad{color:#ff7d7d}
    code{background:#101425;border:1px solid #1d2235;border-radius:8px;padding:2px 6px}
  </style>
  <script>
    // Tiny client-side router so /login etc. load this page:
    function route(){
      const path = location.pathname.replace(/\/+$/,'') || '/';
      const view = document.getElementById('view');
      const routes = {
        '/': 'Welcome to BlackRoad.io — site is LIVE via GitHub Pages.',
        '/login': 'Login placeholder (static).',
        '/chat': 'Chat placeholder (local-only LLM to be wired on API later).',
        '/memories': 'Memories placeholder.',
        '/coding': 'Coding portal placeholder.',
        '/backend': 'Backend portal placeholder.'
      };
      view.textContent = routes[path] || '404 — routed to SPA root. Use header links.';
    }
    window.addEventListener('popstate', route);
    window.addEventListener('DOMContentLoaded', route);
    function go(p){history.pushState({},'',p);route();return false;}
    async function checkHealth(){
      try{
        const r=await fetch('/health.json',{cache:'no-store'});
        const j=await r.json();
        document.getElementById('health').innerHTML =
          `<span class="ok">●</span> HEALTH ok — ${new Date().toISOString()}`;
      }catch(e){
        document.getElementById('health').innerHTML =
          `<span class="warn">●</span> HEALTH file not found`;
      }
    }
    document.addEventListener('DOMContentLoaded',checkHealth);
  </script>
</head>
<body>
  <header>
    <div class="wrap">
      <div class="pill">BLACKROAD • Pages Deployment</div>
      <h1>BlackRoad.io</h1>
      <nav>
        <a href="/" class="btn" onclick="return go('/')">Home</a>
        <a href="/login" class="btn" onclick="return go('/login')">Login</a>
        <a href="/chat" class="btn" onclick="return go('/chat')">Chat</a>
        <a href="/memories" class="btn" onclick="return go('/memories')">Memories</a>
        <a href="/coding" class="btn" onclick="return go('/coding')">Coding</a>
        <a href="/backend" class="btn" onclick="return go('/backend')">Backend</a>
        <a href="health.json" class="btn">Health</a>
        <a href="https://github.com" target="_blank" class="btn primary">Open Repo</a>
      </nav>
    </div>
  </header>

  <main class="wrap">
    <p id="health" class="tag">Checking health…</p>
    <div id="view" class="card" style="min-height:90px"></div>
    <section class="grid" style="margin-top:16px">
      <div class="card"><div class="tag">Status</div>
        Static deployment via GitHub Pages. No droplet required. DNS points to GitHub. SPA routing enabled.
      </div>
      <div class="card"><div class="tag">Next steps</div>
        Wire a real API behind <code>/api</code> later (Cloudflare Workers/Pages Functions or your Node API).
      </div>
      <div class="card"><div class="tag">Brand</div>
        Colors: <code>#FF4FD8</code>, <code>#0096FF</code>, <code>#FDBA2D</code>.
      </div>
    </section>
  </main>

  <footer><div class="wrap">© BlackRoad.io</div></footer>
</body>
</html>
HTML

# GitHub Pages workflow
cat > .github/workflows/pages.yml <<'YAML'
name: Deploy to GitHub Pages
on:
  push:
    branches: [ "main" ]
  workflow_dispatch: {}
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set build time
        run: echo "BUILD_TIME=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_ENV
      - name: Inject build time into health.json
        run: |
          sed -i "s/\${BUILD_TIME}/${BUILD_TIME}/g" health.json
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - name: Deploy to Pages
        id: deployment
        uses: actions/deploy-pages@v4
YAML

# Git init + first push (requires your local git to be authenticated already)
git init
git add .
git commit -m "BlackRoad.io — live static site via GitHub Pages"
git branch -M main

# Create GitHub repo if not exist (will error if it exists; safe to ignore)
if command -v gh >/dev/null 2>&1; then
  gh repo create "$GH_REPO" --public -y || true
  git remote add origin "https://github.com/$GH_REPO.git" || true
else
  git remote add origin "https://github.com/$GH_REPO.git" || true
fi

git push -u origin main
echo "Pushed. Now enable GitHub Pages: Settings → Pages → 'Build and deployment: GitHub Actions'."
echo "DNS: point blackroad.io to GitHub Pages (A/ALIAS). See notes below."
