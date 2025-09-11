# BlackRoad API Bridge

Lightweight Express + WS bridge served behind NGINX:

- /api/health.json — JSON health
- /ws — WebSocket echo (diagnostic)

## Local

```bash
cd services/api
npm i
npm start # :4000
```

## Systemd (server)

- Installed by CI to /etc/systemd/system/blackroad-api.service
- Sources under /opt/blackroad/api
- Manage:

```bash
sudo systemctl status blackroad-api
sudo systemctl restart blackroad-api
```

_Last updated on 2025-09-11_
