# ADR 0001: Prism Service Tech Stack

## Status

Accepted

## Context

The Prism service requires a lightweight HTTP layer capable of handling
event streams and JSON APIs with type safety.

## Decision

Use **Node.js** with **TypeScript** and **Fastify**. Validation is handled by
`zod`, and tests are written with `vitest`.

## Consequences

TypeScript provides compile-time assurances while Fastify keeps runtime
overhead low. The stack aligns with existing tooling in the repository and
supports rapid iteration.
