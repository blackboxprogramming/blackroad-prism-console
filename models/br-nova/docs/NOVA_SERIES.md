# BR-NOVA Model Family

The BR-NOVA series defines a ladder of decoder-only transformers trained from
scratch with BlackRoad-native corpora and infrastructure.  Each tier builds on
the same architectural primitives and is optimized for a specific hardware
footprint.

## Common Features

- RMSNorm + SwiGLU transformer blocks with rotary position embeddings.
- Flash-style attention kernels and gradient checkpointing.
- Guardian-mediated data ingestion and Codex run-card reporting.
- Native tokenizer (`nova-v1`) with Unicode-aware segmentation.

## Model Tiers

| Model             | Params | Context | Target Hardware           | Primary Use Case              |
| ----------------- | ------ | ------- | ------------------------- | ----------------------------- |
| BR-Seed-125M      | 125M   | 4K      | Raspberry Pi 5, laptops   | Bootstrap, unit tests         |
| BR-Sprout-350M    | 350M   | 8K      | Jetson Orin Nano          | Teaching, light agents        |
| BR-Branch-1.3B    | 1.3B   | 8-16K   | Single 24–48GB GPU        | Coding, research baseline     |
| BR-Canopy-3B      | 3B     | 16K     | Multi-GPU / CPU cluster   | Long-memory orchestration     |
| BR-Grove-7B (P2)  | 7B     | 32K     | Distributed on-prem nodes | Extended experiments (Phase2) |

## Training Milestones

1. Build tokenizer pipeline and freeze nova-v1.
2. Ingest, filter, and pack curated corpora with Guardian oversight.
3. Train BR-Seed-125M, export GGUF + int4 quantized checkpoints.
4. Expand curriculum and sequence length schedules through higher tiers.
5. Capture evals and run cards for every milestone.

## Deployment Targets

- `llama.cpp`-compatible GGUF exports for Pi and Jetson targets.
- PyTorch runtime for research and experimentation.
- ReflexBus + Guardian telemetry for observability and compliance.
