# BR-NOVA Data Lineage

This document summarizes how data flows through the BR-NOVA stack and the
artifacts produced at each stage.

## Source Registration

1. Data stewards describe each corpus in a YAML spec (`data/sources/*.yaml`).
2. Guardian validates licensing, provenance, and policy tags.
3. `dataset_ingest.py` stages the files, computes hashes, and emits manifest
   jsonl files to `models/br-nova/data/manifests/`.

## Quality Filters

1. `filter_dedupe.py` cleans the manifests using deterministic heuristics.
2. Filter metadata is appended to every sample under the `filters` key.
3. Guardian receipts and hash lineage are captured in run cards.

## Tokenization & Packing

1. The `nova-v1` tokenizer encodes text via offline jobs, writing `token_ids` to
   intermediate jsonl files.
2. `pack_sequences.py` packs token IDs into near-uniform sequences for each
   training tier.
3. Packed batches are stored with deterministic filenames containing manifest
   hashes and tokenizer versions.

## Run Cards

- Codex generates run cards aligned with `schemas/run_card.schema.json`.
- Run cards include dataset manifests, git commit, docker digest, and Guardian
  receipts.
- Each training/eval job writes a run card entry to `models/br-nova/data/run_cards/`.

## Retention

- Raw corpora remain in cold storage with Guardian-managed access controls.
- Packed datasets older than 90 days must be revalidated before reuse.
- Quantized artifacts inherit lineage metadata and are stored alongside their
  float checkpoints.
