#!/bin/bash
set -euo pipefail

apt-get install -y nginx
cat <<'CFG' > /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
events { worker_connections 1024; }
http {
  include       mime.types;
  sendfile      on;
  limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;
  limit_conn_zone $binary_remote_addr zone=addr:10m;
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=24h;
  server {
    listen 80 default_server;
    location / {
      proxy_pass http://lucidia:8080;
      limit_req zone=mylimit burst=20;
      limit_conn addr 10;
    }
  }
}
CFG
systemctl enable --now nginx
