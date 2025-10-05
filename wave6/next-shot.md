# Next Shot Recommendation

## Recommendation
**Prioritize the bridge spike** to de-risk the cross-domain transport early while other pipeline and release tracks are stabilizing.

## Rationale
- **Critical path dependency:** Token-gated playback and future cross-product flows assume reliable access control against on-chain proofs. Without an interchain bridge, RoadWeb cannot verify entitlements minted through RoadStudio outputs.
- **Risk concentration:** The bridge involves third-party chains (IBC first, then EVM via an audited adapter) and rate-limit middleware—areas with the highest unknowns and potential audit flags. Spiking now exposes integration and security concerns before we lock the release train.
- **Parallelism:** Publish UX polish and audit prep mostly build on existing CI/CD workstreams. The bridge spike can run in parallel, informing configuration and threat models the audit track will need anyway.
- **Demo impact:** The E2E loop demo hinges on demonstrating token-gated playback backed by verifiable claims. Landing the bridge stub early enables a compelling showcase even if UX refinements arrive later.

## Immediate Actions
1. Stand up the IBC channel scaffold with mocked counterparty to validate handshake, relaying, and rate-limit middleware hooks.
2. Draft interface contracts for the EVM adapter, highlighting audit touchpoints and dependency on the upstream review.
3. Feed findings into audit prep checklists (threat model deltas, key custody, monitoring hooks) so the compliance path can pick them up without rework.
4. Capture integration assumptions and block diagrams for the publish team to reference while improving UX flows.

## Checkpoints
- ✅ Successful simulated IBC transfer through rate-limited middleware with trace logs.
- ✅ Documented adapter API signed off by security for audit scoping.
- ✅ Updated demo script showing the bridge in the entitlement verification path.
