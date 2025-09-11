<!-- /opt/blackroad/mirrors/README.md -->
# Mirrors
Set npm to Verdaccio:
```
npm set registry http://verdaccio:4873
```
Set pip to devpi:
```
pip config set global.index-url http://devpi:3141/root/pypi/
```
Use local registry:
```
docker pull localhost:5001/myimage
```

_Last updated on 2025-09-11_
