# Prism Portal Connector Prompt – BlackRoad.io

"Extend the Prism portal so Codex agents can push code directly to BlackRoad.io via the `/connectors` API. Requirements:"

## 1. Connector Binding in Prism

- Add a **Codex → Connectors bridge** inside `/connectors`.
- Each Codex agent gets an extra parameter:
  - `"deploy": true` (means output goes to `/connectors/paste`).
  - `"path": "/var/www/blackroad/<file>"` or `"path": "/srv/blackroad-api/<file>"`.
- Codex agents no longer just *print* output — they can write it live.

## 2. Workflow Flow

1. User runs Codex prompt in Prism.
2. Codex generates code output.
3. If `deploy:true`, Prism auto-wraps output into:
   ```json
   {
     "action": "paste",
     "path": "<server file path>",
     "content": "<code content>"
   }
   ```
4. Prism sends to `https://blackroad.io/connectors/paste` with Bearer token.
5. Server writes file, responds `{ok:true}`.
6. Prism confirms success in the UI (“Deployed ✅ to /var/www/blackroad/file”).

## 3. Supported Actions

- `paste` (overwrite file)
- `append` (append lines)
- `replace` (regex replace)
- `restart` (systemctl restart service)
- `build` (npm/pip rebuild target)

All actions routed through Prism agent → `/connectors`.

## 4. UI Integration in Prism

- Add **“Deploy to BlackRoad.io” toggle** in each agent window.
- Add **file path selector** (default `/var/www/blackroad/`).
- Show deployment logs in Prism console:
  - `[✓] File written to /var/www/blackroad/lucidia-dev.html`
  - `[✓] Restarted blackroad-api.service`
  - `[✓] Nginx reload successful`

## 5. Validation Layer

- After paste, Prism automatically runs:
  - `curl https://blackroad.io/<file>` (if frontend file)
  - `curl http://127.0.0.1:<port>/health` (if service file)
- Prism shows result inline in agent window (“Health: OK” or “Error: 502”).

## 6. Security

- Prism stores `CONNECTOR_KEY` in `.env`.
- Never expose key in logs.
- All requests must include `Authorization: Bearer <CONNECTOR_KEY>`.

## 7. Example Prism → Connector Call

Codex output:

```html
<!-- FILE: /var/www/blackroad/lucidia-dev.html -->
<html>
  <body>Hello from Prism Codex!</body>
</html>
```

Prism auto-wraps →

```json
{
  "action": "paste",
  "path": "/var/www/blackroad/lucidia-dev.html",
  "content": "<!-- FILE: /var/www/blackroad/lucidia-dev.html -->\n<html>\n  <body>Hello from Prism Codex!</body>\n</html>"
}
```

Sent to: `https://blackroad.io/connectors/paste`

Result: live file updated instantly.

"Goal: Prism portal should let Codex agents **deploy directly to BlackRoad.io** using `/connectors`, with UI feedback, health checks, and logging — turning Prism into a live co-coding + deployment portal."

---

This prompt ensures Codex is **wired straight into your site** through Prism.
