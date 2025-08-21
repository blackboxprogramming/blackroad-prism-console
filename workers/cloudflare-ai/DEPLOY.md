# Deploy (Cloudflare Workers)
1) Ensure you have a Cloudflare account + Workers enabled.
2) Install deps:
   - pnpm i  (or npm i)
3) Local dev:
   - pnpm dev
   - curl -N http://127.0.0.1:8787/chat -H 'content-type: application/json' \
     -d '{ "messages":[{"role":"user","content":"Hello Lucidia!"}] }'
4) Set optional secrets for /gateway (only if you use the Gateway route):
   - wrangler secret put OPENAI_API_KEY
   - wrangler secret put ANTHROPIC_API_KEY
   - (Optionally set provider keys inside the AI Gateway dashboard instead.)
5) Set vars (if not filled in wrangler.toml):
   - wrangler secret put CF_ACCOUNT_ID
   - wrangler secret put CF_GATEWAY_ID
   (or put them under [vars] in wrangler.toml if you’re okay with plaintext)
6) Deploy:
   - pnpm deploy
   - test:
     curl -N https://<your-worker>.workers.dev/chat -H 'content-type: application/json' \
       -d '{ "messages":[{"role":"user","content":"Stream a 1-sentence welcome."}] }'
     curl -N https://<your-worker>.workers.dev/gateway -H 'content-type: application/json' \
       -d '{ "provider":"anthropic","messages":[{"role":"user","content":"Gateway hello."}] }'
