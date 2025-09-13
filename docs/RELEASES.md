# Releases & Images
- Conventional commits → semantic-release bumps version + CHANGELOG.md.
- `release.yml` builds and pushes `ghcr.io/<owner>/blackroad-api:{version}, latest`.
- Droplet can run docker or bare node; choose one deploy path in workflows.
