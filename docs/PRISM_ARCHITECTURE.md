# Prism Service Architecture

The Prism service centers around a Fastify-based TypeScript server that exposes
SSE and REST endpoints. Incoming run requests are validated with `zod` and
executed in a controlled child process. Standard output, errors, and lifecycle
events are published on an in-memory `EventEmitter` bus for real-time clients.

```text
client --> /run --> validator --> spawn --> event bus --> client
                    |                         |
                    v                         v
                 policy store            file system
```

Diff application requests follow a similar path. Approved patches are written to
`prism/work/` only after policy checks and path sanitization. External
integrations include OpenAI for model-backed features and optional AWS services
(S3 for artifacts, RDS for persistence). Data flows are ephemeral unless a
backing database or bucket is configured.
