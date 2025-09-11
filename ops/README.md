# BlackRoad secure overlay
Apply with: `kubectl create ns argo && kubectl -n argo apply -k ops/overlays/secure`
Notes:
- Uses Argo's Emissary executor (default since 3.4).
- Switch server auth to SSO by changing `--auth-mode=sso` and configuring OIDC.

_Last updated on 2025-09-11_
