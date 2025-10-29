# Security and AI Tune-Up Playbook

## 15-Minute Security Hardening (npm + Perimeter)

### Why Now
GitHub is tightening npm security after recent supply-chain attacks. Maintainers are being moved toward Trusted Publishing (OIDC), hardware security keys (FIDO/WebAuthn) for two-factor authentication (2FA), and short-lived authentication tokens. Legacy tokens and TOTP-based 2FA are expected to be deprecated, and enforced 2FA will apply to local publishes.

### Action Checklist
1. **Migrate npm publishing to Trusted Publishing (OIDC)**
   - In npm, add a Trusted Publisher that targets the appropriate repository and workflow.
   - Update the CI workflow to grant `id-token: write` and remove usage of `NODE_AUTH_TOKEN` secrets.
   - Benefit: eliminates long-lived tokens and enables automatic provenance on publish.
2. **Enforce strong 2FA (FIDO2/WebAuthn) across npm and GitHub**
   - Require 2FA for organization write/publish permissions and register at least two hardware security keys.
   - Prioritize WebAuthn over TOTP to align with GitHub’s upcoming authentication requirements.
3. **Rotate or retire stale credentials**
   - Delete classic or long-lived npm tokens and replace remaining CI secrets with OIDC-based auth.
   - Reduce GitHub PAT scopes to the minimum required permissions and set short expirations (7-day target).
4. **Lock cloud and API tokens to least privilege**
   - Scope DigitalOcean, Cloud provider, or other API keys to only the required actions and prefer per-service tokens.
5. **Add Cloudflare rate limits to `/login` and administrative routes**
   - Configure per-IP and username (or JA3/JA4) thresholds with challenge-then-block responses for bursts.
   - Use Cloudflare Request Rate Analysis to establish baseline limits and deploy rules that target `/login` and admin paths, excluding allowlisted IP ranges.

## 30-Minute AI Experiment (RAG Signal Check)

1. Select a representative document that users frequently reference.
2. Define three real user questions tied to that document.
3. Run an A/B comparison:
   - **No-RAG:** vanilla LLM prompt without retrieval.
   - **RAG:** same prompt supplemented with retrieved document chunks.
4. Measure for each question:
   - Exact-match accuracy.
   - Latency (p50).
   - Subjective helpfulness on a 1–5 scale.
5. Decide the default behavior:
   - Keep RAG on if it answers at least two of three questions correctly and adds less than 1.5× latency.
   - Otherwise, continue with No-RAG and iterate on prompt quality before investing further in retrieval.

## Reflection Prompt
Spend five minutes journaling on: **“Which single assumption, if flipped today, would 10× user trust?”**

Capture a two-minute voice note to act as a storyboard seed for a future explainer.
