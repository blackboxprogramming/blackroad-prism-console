# 0001: Initial Stack

- Status: accepted
- Date: 2024-01-01

## Context

The project requires a lightweight stack that can be deployed quickly and maintained easily.

## Decision

Adopt Node.js with Express for the API layer, Postgres for persistence, Docker for containerization, and Terraform for provisioning cloud resources.

## Consequences

This stack accelerates development and provides a clear path to production. It introduces the responsibility to keep Node and Terraform tooling up to date.
