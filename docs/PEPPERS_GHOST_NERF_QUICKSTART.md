# Pepper's Ghost Neural Rendering Quickstart

## Goals
- Bring "alive" motion to Lucidia's Pepper's Ghost cube with lightweight neural renderers.
- Keep the capture → train → render cycle short enough for rapid iteration.
- Ensure assets run comfortably on Jetson Orin–class edge hardware.

## Capture Checklist
1. **Scene prep**: place subject on a dark, non-reflective surface with controlled key light plus fill.
2. **Camera path**: walk a slow semicircle (120°–180° arc) with a phone at chest height; 30–120 evenly spaced frames.
3. **Reference frame**: shoot a 2–3 s video sweep for later photometric checks.
4. **Organize**: store images under `captures/<scene_name>/images` and optional video under `captures/<scene_name>/ref.mp4`.

## Tiny Nerfstudio Command Set
```bash
# 1) Environment (Jetson or desktop w/ CUDA 11.4+)
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install nerfstudio[instant-ngp]

# 2) Data ingestion
ns-process-data images \
  --data ./captures/<scene_name>/images \
  --output-dir ./datasets/<scene_name> \
  --matching-colmap \
  --num-workers 4

# 3) Rapid Instant-NGP training (FP16-friendly)
ns-train instant-ngp \
  --data ./datasets/<scene_name> \
  --output-dir ./runs/<scene_name> \
  --timestamp `date +%Y%m%d-%H%M%S` \
  instant_ngp.enable_collider=False \
  viewer.num_rays_per_batch=1024 \
  pipeline.datamanager.eval_num_rays_per_batch=1024 \
  pipeline.model.max_res=2048 \
  pipeline.model.use_fp16=True

# 4) Bake a looping render for the cube
ns-render \
  --load-config ./runs/<scene_name>/<timestamp>/config.yml \
  --traj-file trajectories/slow_orbit.json \
  --output-path renders/<scene_name>/slow_orbit.mp4 \
  --width 1080 --height 1080 \
  --seconds 8 --fps 15
```

## Jetson-Oriented Instant-NGP Preset
```yaml
# save as configs/jetson_instant_ngp.yaml
instant_ngp:
  trainer:
    max_num_iterations: 2500
    mixed_precision: true
    gradient_accumulation_steps: 1
  viewer:
    num_rays_per_batch: 768
  pipeline:
    model:
      use_fp16: true
      log2_hashmap_size: 18      # smaller hash grid
      num_levels: 12
      base_resolution: 16
      max_resolution: 1024
      cone_angle_constant: 0.0
      hidden_dim: 32
    datamanager:
      eval_num_rays_per_batch: 768
      cameras_per_batch: 1
```
Invoke with:
```bash
ns-train instant-ngp --data ./datasets/<scene_name> --load-config configs/jetson_instant_ngp.yaml
```

## Gaussian Splatting Option
- Export COLMAP poses as usual (`ns-process-data images --matching-colmap`).
- Train via `gaussian-splatting` repo (ensure `--sh-degree 2`, `--position-lr 1.5e-3`).
- Use a viewer with level-of-detail streaming (e.g., **gsplat** LOD branch) to hit 10–15 Hz on Orin by capping splats per tile.
- Render precomputed loops (`python scripts/render.py --lod 2 --fps 15 --seconds 8`).

## Display Loop Tips
- Keep playback at 15 fps; duplicate the video on all four cube faces.
- Use a gentle camera orbit + 5–10° vertical nod to emphasize parallax.
- Add emissive "breathing" via exposure ramp during render (`--exposure-gain 0.9 1.1`).

## Starter Scenes for Lucidia Tabs
| Tab | Concept | Capture Notes |
|-----|---------|----------------|
| **Lucidia / Core** | *Breathing glyph* | 3D print or etch the logo, uplight with diffuse LED, capture 60 frames. |
| **Codex** | *Floating cards* | Suspend translucent cards with fishing line; capture 90 frames focusing on parallax between layers. |
| **Echoes** | *Ambient heartlight* | Film a small LED sculpture with slow color cycling; keep exposure constant to highlight neural glow. |

## Next Steps
- Automate capture ingestion scripts inside `lucidia` CLI (future work).
- Experiment with NeRF-VINS integration for live camera parallax once static loops feel dialed-in.
- Share first loop renders in `renders/` for review before syncing to Pepper's Ghost cube.
