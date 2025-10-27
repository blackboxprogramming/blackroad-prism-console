# Prism Mathematical Research Framework Overview

This note connects the existing Prism Console assets that underpin a Codex-22 style
mathematical research loop. It highlights how multi-agent reasoning, deep mathematical
blueprints, and the console API already interlock so that new intake flows (for
example, Riemann Hypothesis or P vs NP studies) can be grounded without additional
infrastructure.

## Multi-agent reasoning backbone

- **Novelty manifests.** The novelty agents catalogue encodes domain-specific
  reasoning modes—`math`, `geometry`, `godel`, `infinity`, and others—through their
  manifest files. Each manifest advertises a lightweight capability surface that can be
  orchestrated as independent solver personalities. 【F:prism/agents/novelty/math/manifest.json†L1-L8】【F:prism/agents/novelty/geometry/manifest.json†L1-L8】【F:prism/agents/novelty/godel/manifest.json†L1-L8】【F:prism/agents/novelty/infinity/manifest.json†L1-L8】
- **IPC dispatch.** The IPC layer exposes single-function adapters (e.g., `math.js`,
  `geometry.js`) that forward requests into the manifest-defined agents through the
  shared agent table. These hooks already provide a message bus for proof attempts,
  contradiction logging, or lemma synthesis tasks. 【F:prism/ipc/math.js†L1-L2】【F:prism/ipc/geometry.js†L1-L2】

Together these files give the Codex-22 mathematician a ready-made arena for spawning
specialised solvers and exchanging intermediate statements.

## Mathematical blueprints

Two deep-reference documents inside the repository serve as theoretical scaffolds for
advanced proof work:

1. **Manifold → Topos schematic.** This document walks from Riemannian metrics through
   curvature, symplectic form, and categorical logic, effectively mapping continuous
   dynamics into proof-theoretic lenses. It is a natural backbone for research that
   couples geometric analysis with logical validation, such as Riemann Hypothesis
   programs. 【F:docs/prism/manifold_to_topos_schematic.md†L1-L78】
2. **Geometry-Memory Transport framework.** This AI blueprint weaves Hamiltonian flow,
   information geometry, optimal transport, associative memory, and control-as-inference
   into a single training stack. It gives explicit recipes for symplectic learning and
   transport-aware objectives, directly supporting analytic and synthetic proof agents.
   【F:docs/ai/geometry_memory_transport_framework.md†L1-L142】

## Console API integration

The Prism Console API already supplies data models for tracking agents, events, and
structured artefacts like runbooks. These models can readily host proof objects or
intake submissions once the corresponding schemas are defined. 【F:services/prism-console-api/src/prism/models.py†L1-L45】

With these layers combined, the repo contains the key primitives required to implement
formal intake workflows, agentic proof loops, and mathematical experiment telemetry
without first rebuilding infrastructure.
