# Runs entirely local. Exposes /health, /sample, /upsample.
# Depends on the guided-diffusion repo installed locally (pip install -e .).
import json
import random
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
import yaml
from fastapi import FastAPI, HTTPException

# guided-diffusion internal utilities
# Ensure the guided_diffusion package is importable (pip install -e . in the repo)
from guided_diffusion.script_util import (
    create_model_and_diffusion,
    model_and_diffusion_defaults,
)
from pydantic import BaseModel

# --- Config bootstrap ---
HERE = Path(__file__).resolve().parent
CFG = yaml.safe_load(open(HERE / "config.yaml", "r"))
MODEL_DIR = Path(CFG["MODEL_DIR"])
RUNS_DIR = Path(CFG["RUNS_DIR"])
DEVICE = CFG.get("device", "cuda" if torch.cuda.is_available() else "cpu")


# Minimal model registry for common image sizes (you can add variants)
def base_model_flags(image_size=256, class_cond=True):
    # Mirrors typical README flags; adjust as needed.
    flags = model_and_diffusion_defaults()
    flags.update(
        dict(
            image_size=image_size,
            num_channels=256,
            num_res_blocks=2,
            num_head_channels=64,
            attention_resolutions="32,16,8",
            dropout=0.0,
            class_cond=bool(class_cond),
            learn_sigma=True,
            diffusion_steps=1000,
            noise_schedule="linear",
            resblock_updown=True,
            use_fp16=True,
            use_scale_shift_norm=True,
            timestep_respacing="",
        )
    )
    return flags


def _resolve(p: str) -> Path:
    q = Path(p)
    return q if q.is_absolute() else (MODEL_DIR / q)


def _load_model(path: Path, image_size=256, class_cond=True, timestep_respacing=""):
    flags = base_model_flags(image_size=image_size, class_cond=class_cond)
    if timestep_respacing:
        flags["timestep_respacing"] = timestep_respacing
    model, diffusion = create_model_and_diffusion(**flags)
    model_path = _resolve(str(path))
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    if flags["use_fp16"] and DEVICE.startswith("cuda"):
        model.convert_to_fp16()
    model.to(DEVICE)
    model.eval()
    return model, diffusion, flags


def _load_classifier(path: Path, image_size=256):
    # Classifier architectures live in the repo scripts; here we load a saved torch module.
    classifier_path = _resolve(str(path))
    if not classifier_path.exists():
        raise FileNotFoundError(f"Classifier not found: {classifier_path}")
    classifier = torch.load(classifier_path, map_location="cpu")
    if DEVICE.startswith("cuda"):
        classifier.to(DEVICE)
    classifier.eval()
    return classifier


def _prepare_seed(seed: Optional[int]):
    if seed is not None:
        random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)


# --- Pydantic I/O ---
class SampleRequest(BaseModel):
    # Core knobs
    image_size: Optional[int] = None
    num_samples: Optional[int] = None
    batch_size: Optional[int] = None
    seed: Optional[int] = None
    timestep_respacing: Optional[str] = None

    # Conditioning
    class_id: Optional[int] = None  # 0..999 for ImageNet; ignored if class_cond=False
    classifier_scale: Optional[float] = None

    # Explicit model paths (override config)
    diffusion_path: Optional[str] = None
    classifier_path: Optional[str] = None


class SampleResponse(BaseModel):
    run_dir: str
    files: List[str]
    meta: Dict[str, Any]


# --- App ---
app = FastAPI(title="BlackRoad Diffusion Service", version="1.0")


@app.get("/health")
def health():
    return {"ok": True, "device": DEVICE}


@app.post("/sample", response_model=SampleResponse)
@torch.inference_mode()
def sample(req: SampleRequest):
    # Defaults
    dfl = CFG["defaults"]
    image_size = req.image_size or dfl["image_size"]
    num_samples = req.num_samples or dfl["num_samples"]
    batch_size = req.batch_size or dfl["batch_size"]
    seed = dfl["seed"] if req.seed is None else req.seed
    timestep_respacing = req.timestep_respacing or dfl["timestep_respacing"]
    classifier_scale = (
        req.classifier_scale if req.classifier_scale is not None else dfl["classifier_scale"]
    )

    _prepare_seed(seed)

    # Resolve models
    diffusion_path = req.diffusion_path or CFG["model_paths"].get(f"diffusion_{image_size}", None)
    classifier_path = req.classifier_path or CFG["model_paths"].get(
        f"classifier_{image_size}", None
    )
    if not diffusion_path:
        raise HTTPException(400, f"No diffusion model configured for {image_size}.")

    # Load
    model, diffusion, flags = _load_model(
        diffusion_path,
        image_size=image_size,
        class_cond=classifier_path is not None,
        timestep_respacing=timestep_respacing,
    )
    classifier = None
    if classifier_path:
        classifier = _load_classifier(classifier_path, image_size=image_size)

    # Sampler setup

    def cond_fn(x, t, y=None):
        if classifier is None or y is None:
            return None
        with torch.enable_grad():
            x_in = x.detach().requires_grad_(True)
            logits = classifier(x_in, t)
            log_probs = torch.nn.functional.log_softmax(logits, dim=-1)
            selected = log_probs[range(x_in.shape[0]), y.view(-1)]
            grad = torch.autograd.grad(selected.sum(), x_in)[0]
            return grad * classifier_scale

    # Labels
    y = None
    if flags["class_cond"] and req.class_id is None:
        raise HTTPException(400, "class_id required for classifier-guided sampling.")
    if flags["class_cond"]:
        y = torch.tensor([req.class_id] * batch_size, device=DEVICE)

    # Output run folder
    ts = time.strftime("%Y%m%d-%H%M%S")
    run_dir = RUNS_DIR / f"sample_{image_size}_{ts}"
    run_dir.mkdir(parents=True, exist_ok=True)

    # Sampling loop
    def to_uint8(x):
        x = (x + 1) * 127.5
        return x.clamp(0, 255).to(torch.uint8)

    all_files = []
    total = 0
    while total < num_samples:
        this_bs = min(batch_size, num_samples - total)
        model_kwargs = {}
        if y is not None:
            model_kwargs["y"] = y[:this_bs]

        noise = torch.randn((this_bs, 3, image_size, image_size), device=DEVICE)
        sample_fn = (
            diffusion.p_sample_loop if timestep_respacing == "" else diffusion.ddim_sample_loop
        )
        out = sample_fn(
            model,
            (this_bs, 3, image_size, image_size),
            noise=noise,
            clip_denoised=True,
            model_kwargs=model_kwargs,
            cond_fn=(cond_fn if classifier is not None else None),
            device=DEVICE,
        )
        imgs = to_uint8(out).permute(0, 2, 3, 1).contiguous().cpu().numpy()
        for i in range(this_bs):
            fp = run_dir / f"img_{total + i:05d}.png"
            from PIL import Image

            Image.fromarray(imgs[i]).save(fp)
            all_files.append(str(fp))
        total += this_bs

    meta = dict(
        image_size=image_size,
        num_samples=num_samples,
        batch_size=batch_size,
        seed=seed,
        classifier_scale=classifier_scale,
        diffusion_path=str(_resolve(diffusion_path)),
        classifier_path=(str(_resolve(classifier_path)) if classifier_path else None),
        timestep_respacing=timestep_respacing,
        device=DEVICE,
    )
    (run_dir / "meta.json").write_text(json.dumps(meta, indent=2))
    return SampleResponse(run_dir=str(run_dir), files=all_files, meta=meta)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8009)
