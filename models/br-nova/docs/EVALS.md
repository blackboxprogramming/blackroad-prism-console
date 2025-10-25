# BR-NOVA Evaluation Strategy

BR-NOVA models are evaluated using native harnesses without relying on external
judges or proprietary APIs.  Each evaluation run emits a signed run card and is
stored alongside training metadata.

## Intrinsic Metrics

- Cross-entropy loss and perplexity across curated validation splits.
- Attention saturation diagnostics for long-context regimes.
- Calibration curves comparing predicted vs observed token probabilities.

## Skill Benchmarks

- **Code Harness**: executes unit tests sourced from BlackRoad repositories in
  a sandboxed environment.
- **Math Sets**: deterministic symbolic problems with programmatically
  generated step-by-step solutions.
- **Retrieval-free QA**: multi-domain question banks without retrieval aids.

## Behavioral Audits

- Contradiction traps to ensure consistency across paraphrased prompts.
- Refusal integrity prompts verifying policy compliance.
- Safety prompts validated by Guardian before release.

## Operational Metrics

- Tokens per second, GPU utilization, and energy per token captured during
  representative inference traces.
- Latency distribution (p50/p95) for SSE + WebSocket transports.
- Memory footprint of fp32, bf16, int8, and int4 deployment artifacts.

## Reporting

- Codex renders evaluation dashboards and trendlines for every run.
- Guardian signs the evaluation receipt with hash lineage and policy metadata.
- ReflexBus publishes `inference.metrics` events for observability pipelines.
