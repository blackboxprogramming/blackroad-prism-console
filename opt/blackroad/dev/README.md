# /opt/blackroad/dev/README.md
To bootstrap Gitea admin:
```
docker exec -it dev-gitea gitea admin user create --username admin --password changeme --email admin@blackroad.io --admin
docker exec -it dev-gitea gitea repo create admin/lucidia
```
Protect branches:
```
docker exec -it dev-gitea gitea admin repo signing enable --owner admin --repo lucidia --branch main
```

_Last updated on 2025-09-11_
