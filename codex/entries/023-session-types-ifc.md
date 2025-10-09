# Codex 23 — Session Types & IFC — Make Illegal States Unrepresentable

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Guarantee protocol correctness and data-flow integrity through type systems.

## Core
- Encode communication protocols as session types \(S\) where duality ensures endpoint compatibility.
- Enforce information-flow control with lattice labels \(L\) so that \(a \sqsubseteq b\) implies data may flow from \(a\) to \(b\).
- Reject programs at compile time that violate session orderings or IFC policies.

## Runbook
1. Annotate endpoints with their session types and label data using the IFC lattice.
2. Compile the system and refuse builds that violate session progression or confidentiality rules.
3. Deploy runtime monitors at explicit declassification points to enforce residual policies.

## Telemetry
- Compile-time rejection rates broken down by rule.
- Runtime policy hits and declassification events.
- Developer feedback loops on protocol evolution.

## Failsafes
- Treat any violation as a hard failure requiring explicit declassification and audit trails.
- Freeze deployments if monitors detect unexpected flows until policy or code is adjusted.

**Tagline:** Type the protocol, tame the flow.
