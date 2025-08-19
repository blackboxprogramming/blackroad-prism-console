import base64
import io
import math
import os

import torch
from PIL import Image


def autodiscover_ckpt(model_dir):
    if not os.path.isdir(model_dir):
        return None
    cands = sorted([p for p in os.listdir(model_dir) if p.endswith(".pt")], reverse=True)
    return os.path.join(model_dir, cands[0]) if cands else None


def _load_model_from_vendor(ckpt_path, device):
    from importlib import import_module

    glow_mod = import_module("vendor.glow_pytorch.model")
    model = glow_mod.Glow(3, 64, 32, 3)
    sd = torch.load(ckpt_path, map_location=device)
    state = sd["model"] if isinstance(sd, dict) and "model" in sd else sd
    model.load_state_dict(state, strict=False)
    model.to(device).eval()
    return model


@torch.inference_mode()
def sample_grid_b64(ckpt_path, n=8, temperature=0.7, out_size=64, seed=0):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch.manual_seed(seed)
    model = _load_model_from_vendor(ckpt_path, device)
    z = torch.randn(n, 3, out_size, out_size, device=device) * temperature
    x, _ = model(z, reverse=True)
    x = torch.clamp((x + 1) / 2, 0, 1)
    cols = int(math.ceil(math.sqrt(n)))
    rows = int(math.ceil(n / cols))
    pad = 2
    grid = torch.ones(
        3,
        rows * out_size + pad * (rows - 1),
        cols * out_size + pad * (cols - 1),
        device=device,
    )
    k = 0
    for r in range(rows):
        for c in range(cols):
            if k >= n:
                break
            grid[
                :,
                r * (out_size + pad) : r * (out_size + pad) + out_size,
                c * (out_size + pad) : c * (out_size + pad) + out_size,
            ] = x[k]
            k += 1
    img = (grid.permute(1, 2, 0).cpu().numpy() * 255).astype("uint8")
    pil = Image.fromarray(img)
    buf = io.BytesIO()
    pil.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")
