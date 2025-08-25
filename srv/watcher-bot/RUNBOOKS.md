# Watcher Bot Runbooks

## API down
- Check service status:
  ```bash
  systemctl status blackroad-api
  ```
- Inspect logs:
  ```bash
  tail -n 100 /var/log/blackroad-api/app.log
  ```

## SSL expiring
- Renew certificate via certbot:
  ```bash
  sudo certbot renew
  sudo systemctl reload nginx
  ```

## Disk high
- Rotate logs and clean archives:
  ```bash
  logrotate /etc/logrotate.conf
  rm -rf /srv/releases/archive/*
  ```
- Vacuum database:
  ```bash
  sqlite3 /srv/watcher-bot/watcher.db 'VACUUM;'
  ```
