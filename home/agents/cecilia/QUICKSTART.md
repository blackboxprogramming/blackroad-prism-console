# Cecilia Memory System Quickstart

## Verify Deployment
1. Check database: `sqlite3 /srv/blackroad-api/memory.db "SELECT COUNT(*) FROM memory;"`
2. Check API: `curl http://localhost:3000/health`
3. Check agent dir: `ls /home/agents/cecilia/`

## Write Memory
```
curl -X POST http://localhost:3000/api/memory/index \
  -H "Content-Type: application/json" \
  -d '{"text":"[JOIN:CECILIA::ALIVE-CHI-2025-10-28::R04D] Your message here","source":"cecilia","tags":["cecilia"]}'
```

## Search Memory
```
curl -X POST http://localhost:3000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{"q":"CECILIA::ALIVE-CHI-2025-10-28::R04D","top_k":5}'
```

## Troubleshooting
- API not responding? Check: `lsof -i :3000`
- Database locked? Check: `ps aux | grep sqlite`
- Logs: `tail -f /home/agents/cecilia/logs/session.log`
# Cecilia Memory Quickstart

This directory is provisioned automatically when the agent boots. It mirrors the runtime layout on the production host.

## 1. Verify the Memory API

```bash
npm install
npm run memory:server
```

Expect to see:

```
Memory API listening on port 3000 (db: /srv/blackroad-api/memory.db, webdav: http://192.168.4.55:8080/agents/cecilia/memory/)
```

## 2. Write the First Memory

```bash
curl -X POST http://localhost:3000/api/memory/index \
  -H "Content-Type: application/json" \
  -d '{
    "text": "[JOIN:CECILIA::ALIVE-CHI-2025-10-28::R04D] I am alive. Memory system operational.",
    "source": "cecilia",
    "tags": ["cecilia", "resurrection", "deployment"],
    "join_code": "CECILIA::ALIVE-CHI-2025-10-28::R04D"
  }'
```

## 3. Search the Memory Cache

```bash
curl -X POST http://localhost:3000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{"q": "CECILIA::ALIVE-CHI-2025-10-28::R04D", "top_k": 5}'
```

## 4. Inspect WebDAV Persistence

```bash
curl -u mobile:${WEBDAV_PASS} http://192.168.4.55:8080/agents/cecilia/memory/
```

A successful run shows timestamped `.jsonl` files containing the indexed memories.

## 5. Troubleshooting

- `npm test tests/memory_api.test.js` — full API regression suite.
- `sqlite3 /srv/blackroad-api/memory.db "SELECT COUNT(*) FROM memories;"` — confirm cache entries.
- `tail -n 20 logs/memory.txt` — inspect the flat-file fallback log.
