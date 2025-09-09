# PR1 Apply Plan

## Restart Order
1. `systemctl restart yjs`
2. `systemctl restart blackroad-api`
3. `systemctl restart nginx`
4. `systemctl restart ollama-bridge`

## Verification
- `curl -s http://localhost:4000/healthz`
- `curl -s http://localhost:4000/api/projects`
- `curl -s http://localhost:4000/api/devices`
- `curl -s http://localhost:4000/api/llm/health`
- `curl -s http://localhost:12345/yjs/test`
