# Schrödinger Bridge — Troubleshooting

## Marginals fail to balance

- **Symptom:** residual stays > 1e-3 and `sbRun` marks job as failed.
- **Fix:** increase `iters` (e.g., 800), relax `ε` (start at 0.1), or enable a warm-start by reusing the previous `logU/logV` via the
  engine API. Confirm that μ and ν are normalised and non-zero.

## NaNs in diagnostics

- **Symptom:** `diagnostics.json` shows `NaN` for KL or cost.
- **Fix:** clamp input weights to `Number.EPSILON` and ensure cost matrix entries are finite. The engine already clamps, but custom
  distributions loaded through the CLI should be validated.

## Giant artifact sizes

- **Symptom:** `pi.npz` > 200 MB for 512×512 grids.
- **Fix:** enable tiling (`tileSize` option in `computeCostMatrix`) or downsample inputs. For deterministic comparisons, run `sb-run`
  at 256² and only upscale via continuation for presentation.

## Frames file is JSON, not WebM

- **Explanation:** For MVP we emit JSON payloads with interpolation coordinates and label them `frames.webm`. Downstream players
  (Labs UI, control-plane exporters) treat them as structured data and can render actual videos later. This keeps runs deterministic
  and avoids bundling ffmpeg.

## Gateway rejects mutation with `forbidden`

- Ensure your context role is one of `admin`, `ml`, `research`, or `ot`. Tokens are redacted in logs; check the control-plane RBAC
  settings if the CLI is missing the capability.

## Telemetry not visible

- OTel spans require the collector to be initialised. Start the collector locally or set `OTEL_EXPORTER_OTLP_ENDPOINT`. Histogram and
  gauge metrics use the default meter; scrape via `/metrics` on the gateway process once the Prom client is wired in.

## Determinism drift

- Ensure you are not regenerating artifacts on different Node versions. Use Node ≥18.17.
- Check `job.json` for config mismatches, especially ε and cost metric.
- Verify PNG diff using `tests/golden/map.spec.ts`—if it fails, delete `artifacts/sb` and rerun `pnpm test --filter sb-engine`.
