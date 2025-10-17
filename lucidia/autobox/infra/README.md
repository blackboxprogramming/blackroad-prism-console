# Lucidia Auto-Box Infra Notes

- API is designed to run behind TLS termination (e.g., Fly.io, Cloud Run, or container ingress).
- Set `NEXT_PUBLIC_API_BASE_URL` for the web client to route preview requests.
- Feature flags for PQC ciphers and storage envelopes will live in this folder as infrastructure matures.

