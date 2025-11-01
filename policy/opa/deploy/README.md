# Deploy Authorization Policy Bundle

This directory contains the Open Policy Agent (OPA) policy, tests, and supporting
artifacts that gate production deploys for BlackRoad Prism Console. The policy
ensures a deploy only proceeds when commits are signed, CI context is trusted,
quality checks pass, only approved paths change, and required reviewers approve
the change.

## Files

- `policy.rego` – OPA/Rego policy implementing the deploy authorization logic.
- `policy_test.rego` – unit tests covering allow/deny scenarios for the policy.
- `inputs/` – sample JSON payloads that can be used for table-driven integration
  checks in CI pipelines.
- `attestations/attestation.template.json` – DSSE-style attestation payload that
  can be populated and signed for each policy evaluation.

## Running Tests

Use the OPA CLI to execute the unit tests:

```bash
opa test policy/opa/deploy
```

## Evaluating Sample Inputs

Evaluate the policy against a sample input to confirm the allow decision:

```bash
opa eval -i policy/opa/deploy/inputs/happy.json \
  -d policy/opa/deploy/policy.rego \
  "data.deploy.authz.allow"
```

For deny cases, inspect the deny reason:

```bash
opa eval -i policy/opa/deploy/inputs/unverified.json \
  -d policy/opa/deploy/policy.rego \
  "data.deploy.authz.deny_reason"
```

## Generating an Attestation

1. Compute the policy digest: `sha256sum policy/opa/deploy/policy.rego`.
2. Inject the digest into the attestation template (e.g., with `jq`).
3. Sign the populated attestation via Cosign in keyless or key-pair mode.
4. Store the signed attestation alongside release artifacts for provenance.

These steps align with the recommended CI wiring shared in the policy bundle.
