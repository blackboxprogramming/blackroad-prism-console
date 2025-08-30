<!-- FILE: ROLLBACK.md -->

# Rollback Guide

1. Move any directories from `_trash/` back to their original locations, e.g.:
   ```
   git mv _trash/logs ./
   git mv _trash/var/www/blackroad/logs var/www/blackroad/
   ```
2. Revert the commit:
   ```
   git revert HEAD
   ```
