#!/usr/bin/env bash
set -euo pipefail

# --- EDIT THESE ---
export DOMAIN="llm.example.com"            # your public hostname for the gateway
export GROQ_API_KEY="sk-groq-xxxxxxxx"     # your Groq API key
export CLIENT_API_KEY="client-abcdef123"   # the key your apps will use to call the gateway
# ------------------

NS=higress-system

echo "==> Checking deps (kubectl, helm)"
command -v kubectl >/dev/null || { echo "kubectl not found"; exit 1; }
command -v helm >/dev/null || { echo "helm not found"; exit 1; }

echo "==> Installing Higress (namespace: $NS)"
helm repo add higress.io https://higress.io/helm-charts >/dev/null
helm repo update >/dev/null
helm upgrade --install higress higress.io/higress -n "$NS" --create-namespace

echo "==> Writing manifest template"
cat >/tmp/ai-gateway.yaml.tpl <<'YAML'
# Namespace for gateway resources (safe if already exists)
apiVersion: v1
kind: Namespace
metadata:
  name: higress-system
---
# Dev Redis for token metering (used by ai-token-ratelimit)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: default
  labels: { app: redis }
spec:
  replicas: 1
  selector: { matchLabels: { app: redis } }
  template:
    metadata: { labels: { app: redis } }
    spec:
      containers:
        - name: redis
          image: redis:7
          ports: [{ containerPort: 6379 }]
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: default
  labels: { app: redis }
spec:
  selector: { app: redis }
  ports:
    - port: 6379
      targetPort: 6379
---
# Service discovery for Groq + Redis via McpBridge
apiVersion: networking.higress.io/v1
kind: McpBridge
metadata:
  name: default
  namespace: higress-system
spec:
  registries:
    - name: groq
      type: dns
      domain: api.groq.com
      port: 443
    - name: redis
      type: dns
      domain: redis.default.svc.cluster.local
      port: 6379
---
# Public route to Groq through Higress (OpenAI-compatible path)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: llm-groq
  namespace: higress-system
  labels:
    higress.io/resource-definer: higress
  annotations:
    higress.io/backend-protocol: "HTTPS"
    higress.io/destination: "groq.dns"
    higress.io/proxy-ssl-name: "api.groq.com"
    higress.io/proxy-ssl-server-name: "on"
spec:
  ingressClassName: higress
  rules:
    - host: ${DOMAIN}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              resource:
                apiGroup: networking.higress.io
                kind: McpBridge
                name: default
---
# Dummy Ingress to ensure Redis cluster is pushed (required by token limiter)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: redis
  namespace: higress-system
  labels:
    higress.io/resource-definer: higress
  annotations:
    higress.io/destination: redis.dns
    higress.io/ignore-path-case: "false"
spec:
  ingressClassName: higress
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              resource:
                apiGroup: networking.higress.io
                kind: McpBridge
                name: default
---
# AI Proxy: translate OpenAI endpoints to Groq
apiVersion: extensions.higress.io/v1alpha1
kind: WasmPlugin
metadata:
  name: ai-proxy-groq
  namespace: higress-system
spec:
  matchRules:
    - config:
        provider:
          type: groq
          apiTokens:
            - "${GROQ_API_KEY}"
      ingress:
        - llm-groq
  url: oci://higress-registry.cn-hangzhou.cr.aliyuncs.com/plugins/ai-proxy:1.0.0
  priority: 100
---
# Enable AI statistics (required by token limiter to count tokens)
apiVersion: extensions.higress.io/v1alpha1
kind: WasmPlugin
metadata:
  name: ai-statistics
  namespace: higress-system
spec:
  defaultConfig:
    enable: true
  url: oci://higress-registry.cn-hangzhou.cr.aliyuncs.com/plugins/ai-statistics:1.0.0
  priority: 200
---
# API-Key auth: accept ?apikey=... and x-api-key: ...
apiVersion: extensions.higress.io/v1alpha1
kind: WasmPlugin
metadata:
  name: key-auth
  namespace: higress-system
spec:
  defaultConfig:
    global_auth: false
    consumers:
      - name: client
        credential: "${CLIENT_API_KEY}"
    keys: ["apikey", "x-api-key"]
    in_query: true
    in_header: true
    _rules_:
      - _match_domain_: ["${DOMAIN}"]
        allow: ["client"]
  url: oci://higress-registry.cn-hangzhou.cr.aliyuncs.com/plugins/key-auth:1.0.0
  priority: 310
---
# Token rate limiting: 200 tokens/min per client API key (input+output)
apiVersion: extensions.higress.io/v1alpha1
kind: WasmPlugin
metadata:
  name: ai-token-ratelimit
  namespace: higress-system
spec:
  defaultConfig:
    rule_name: default_limit_by_param_apikey
    rule_items:
      - limit_by_param: apikey
        limit_keys:
          - key: "*"
            token_per_minute: 200
    redis:
      service_name: redis.dns
      service_port: 6379
  url: oci://higress-registry.cn-hangzhou.cr.aliyuncs.com/plugins/ai-token-ratelimit:1.0.0
  priority: 600
YAML

echo "==> Rendering with env vars"
envsubst '${DOMAIN} ${GROQ_API_KEY} ${CLIENT_API_KEY}' </tmp/ai-gateway.yaml.tpl >/tmp/ai-gateway.yaml

echo "==> Applying manifest"
kubectl apply -f /tmp/ai-gateway.yaml

echo "==> Waiting for pods"
kubectl rollout status deploy/redis -n default --timeout=180s || true
kubectl get pods -n "$NS" -o wide

echo "==> Smoke test (port-forward -> curl)"
# If you don't have DNS to ${DOMAIN} yet, this local test works:
kubectl -n "$NS" port-forward svc/higress-gateway 18000:80 >/dev/null 2>&1 &
PF_PID=$!
sleep 2
set +e
curl -sS "http://localhost:18000/v1/chat/completions?apikey=${CLIENT_API_KEY}" \
  -H "Host: ${DOMAIN}" -H "Content-Type: application/json" \
  -d '{"model":"llama3-8b-8192","messages":[{"role":"user","content":"hello from Higress"}]}' | jq . || true
kill $PF_PID 2>/dev/null || true
set -e

echo "==> Done. Point your app to: https://${DOMAIN}/v1/chat/completions with header 'x-api-key: ${CLIENT_API_KEY}'"
