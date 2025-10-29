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
