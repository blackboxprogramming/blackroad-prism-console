# Rohonc Codex Decoder Plan

This document collects the current resources in the repository that relate to the Rohonc Codex and outlines the concrete work that would be required to produce the decoder described in recent discussions.

## Existing assets in this repository

- `TheRohoncCodex.html` mirrors the Internet Archive landing page for the public facsimile of the codex.
- `manifest.csv` references `data/raw/Rohonc_Codex_-_Page_Marker_Features.csv`, a tabular feature dataset per folio that was imported previously.
- `sites/blackroad/content/blog/rohonc-codex.md` is a short article summarising the manuscript for the BlackRoad.io website.
- `Rohonci_Codex_K_114cs.pdf` stores a Hungarian-language research paper with background material.

No Python packages named `rohonc_decoder`, `rohonc_symbols`, `rohonc_test`, or `rohonc_visual` are present in the tree, and there is no executable pipeline that performs symbol extraction or decoding yet.

## Gaps between the repository and the proposed framework

1. **Symbol catalogue** – there is no structured dataset enumerating the ~150 graphemes that appear in the manuscript. The raw scans must be annotated or processed with OCR/segmentation before any frequency analysis can occur.
2. **Rotation/partition maths implementation** – the rotational Caesar cipher and partition function logic described in the outline are not implemented. A new module would be needed to support experimentation with the proposed θ = 256/150 ≈ 1.7067 parameterisation.
3. **Test harness and validation corpus** – there are no tests asserting how decoded strings should align with candidate plaintexts (e.g. Hungarian, Latin, or Biblical passages). Synthetic fixtures or references are required to evaluate success criteria.
4. **Visualisation assets** – there is no plotting or documentation that explains the hypothesised "C-String-Zeta-Sleep" structure or the Δ reset markers.

## Recommended next steps

1. Gather or produce high-resolution scans for all 448 pages and index them in `data/` with consistent metadata.
2. Build a symbol extraction pipeline (manual transcription, OCR, or image segmentation) that outputs a normalised symbol inventory and per-page sequences.
3. Prototype the rotational decoder described in the research outline. Begin with parameter sweeps over θ and incorporate the Δ reset logic to compare multiple hypotheses.
4. Design statistical tests that contrast decoded outputs against candidate plaintext corpora to evaluate plausibility.
5. Document the findings and publish intermediate visualisations so other researchers can validate or refute the approach.

By following these steps we can move from the current documentation-only state toward a reproducible decoding workflow.
