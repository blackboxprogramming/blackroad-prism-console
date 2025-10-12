# BLOCK 58 — Meta-Tooling: Living Research System

**[FACT]** Without structure, high-velocity math and hardware work fragments into unrecoverable experiments.
**[THOUGHT]** Encode "Next!" as issues, logs, and automation so every idea, dataset, and figure lands in a predictable place.
**[NOVELTY ANGLE]** Make the repo itself a functor: operations on ideas map to synchronized updates across math, code, and hardware trees.

## Spec / Steps
- **Repo Layout**: instantiate directories `00_charter.md`, `01_symbols/`, `02_blocks/`, `03_code/`, `04_hardware/`, `05_data/`, `06_figures/`, `07_logs/`, `08_papers_notes/`, and `.github/workflows/`.
- **Templates**:
  - Block template stored as `02_blocks/BLOCK_TEMPLATE.md` for quick copy-paste.
  - Lab log template at `07_logs/TEMPLATE.md` capturing intent, actions, observations, decisions, and next steps.
- **Automation**:
  - Add `sim-ci` workflow running tests on push/PR.
  - Add `render-notebooks` workflow that converts notebooks to HTML artifacts when they change.
- **Next! Protocol**:
  - Open issues prefixed with `NEXT —` and labeled by domain (math, build, meta).
  - Close issues by linking to completed block files.
  - Weekly choose one per label; monthly refresh `00_charter.md`.

## Artifacts
- Code: GitHub Actions workflows under `.github/workflows/`.
- Data: DVC/Git-LFS hooks to be added as large datasets arrive.
- Figures: Notebook render outputs archived automatically via CI artifacts.

## Risks & Next
- **Risks**: automation drift if workflows lack dependency pinning; issue backlog if "Next!" items exceed capacity.
- **Next**: wire pre-commit hooks (formatting, artifact checks) and document DVC usage for `05_data/`.
