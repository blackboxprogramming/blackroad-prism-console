# Soft-in-Fluid Collision — Run Summary

- **Scenario ID**: `soft_in_fluid_collision_v1`
- **Run label**: `baseline`
- **Seed**: `20240101`
- **Hardware**: GPU, CPU, RAM, driver
- **Solver build**: Genesis `vX.Y.Z`
- **Timestamp (UTC)**: `2024-02-29T12:01:02Z`

## Thumbnails

| t=0.2 s | t=0.4 s | t=0.6 s | t=0.8 s | t=1.0 s | t=1.2 s |
| --- | --- | --- | --- | --- | --- |
| ![](../10_genesis/runs/<id>/media/frame_020.png) | ![](../10_genesis/runs/<id>/media/frame_040.png) | ![](../10_genesis/runs/<id>/media/frame_060.png) | ![](../10_genesis/runs/<id>/media/frame_080.png) | ![](../10_genesis/runs/<id>/media/frame_100.png) | ![](../10_genesis/runs/<id>/media/frame_120.png) |

## Metrics

| Metric | Generative | Benchmark | Δ | Pass? |
| --- | --- | --- | --- | --- |
| Surface Hausdorff @0.4 s (mm) | 4.2 | 0.0 | +4.2 | ✅ |
| Surface Hausdorff @0.8 s (mm) | 5.8 | 0.0 | +5.8 | ⚠️ |
| Surface Hausdorff @1.2 s (mm) | 6.0 | 0.0 | +6.0 | ⚠️ |
| Stress L2 @0.8 s | 0.12 | 0.00 | +0.12 | ✅ |
| Contact time (A-floor, ms) | 380 | 370 | +10 | ✅ |
| Contact time (A-B, ms) | 550 | 530 | +20 | ⚠️ |
| Free-surface MSE (cm²) | 0.21 | 0.00 | +0.21 | ✅ |
| Mass drift (%) | 0.32 | — | +0.32 | ✅ |

Replace the placeholders with actual values. Use ✅/⚠️/❌ to signal performance.

## Diagnostics

- CFL range: `0.21 – 0.38`
- Solver iterations: `12 ± 4`
- Peak GPU memory: `27.5 GB`
- Runtime: `01:32:15`
- Token usage: `78k prompt`, `160k completion`

## Notes

- Observed mild oscillation after A-B contact; consider higher damping.
- Floor friction disabled; variant run `floor_friction` to check robustness.

---

Attach raw metric JSON + plots under `../40_compare/derived/` and link here for quick
reference.
