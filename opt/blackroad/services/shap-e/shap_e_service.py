import os, io, uuid, json, time, tempfile
from pathlib import Path
from typing import Optional, List, Literal

import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image
import numpy as np
import trimesh

# --- Shap-E internals (local, no external API) ---
from shap_e.diffusion.sample import sample_latents
from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
from shap_e.models.download import load_model, load_config
from shap_e.models.nn.camera import DifferentiableCameraBatch, DifferentiableProjectiveCamera
from shap_e.models.transmitter.base import Transmitter, VectorDecoder
from shap_e.rendering.torch_mesh import TorchMesh
from shap_e.util.collections import AttrDict
from shap_e.util.image_util import load_image as shap_e_load_image
from shap_e.util.notebooks import create_pan_cameras, decode_latent_images

# ---------- Config ----------
OUT_DIR = Path(os.environ.get("SHAP_E_OUTDIR", "/var/blackroad/shap-e/outputs")).resolve()
CACHE_DIR = Path(os.environ.get("SHAP_E_CACHE", "/var/blackroad/shap-e/cache")).resolve()
DEVICE = torch.device(os.environ.get("SHAP_E_DEVICE", ("cuda" if torch.cuda.is_available() else "cpu")))
OUT_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Force Shap-E to cache where we want (optional; Shap-E also uses its own default cache)
os.environ.setdefault("SHAP_E_CACHE", str(CACHE_DIR))

app = FastAPI(title="Shap-E Local Service (BlackRoad/Lucidia)", version="1.0.0")


# ---------- Utilities ----------
def _now_ts() -> str:
    return time.strftime("%Y%m%d-%H%M%S")

def _session_dir(prefix: str) -> Path:
    d = OUT_DIR / f"{_now_ts()}_{prefix}_{uuid.uuid4().hex[:8]}"
    d.mkdir(parents=True, exist_ok=True)
    return d

@torch.no_grad()
def _decode_latent_mesh(xm: Transmitter | VectorDecoder, latent: torch.Tensor) -> TorchMesh:
    """
    Minimal mesh decode (headless, non-notebook).
    """
    cams = create_pan_cameras(size=2, device=latent.device)  # low-res trick; we just want raw mesh
    decoded = xm.renderer.render_views(
        AttrDict(cameras=cams),
        params=(xm.encoder if isinstance(xm, Transmitter) else xm).bottleneck_to_params(latent[None]),
        options=AttrDict(rendering_mode='stf', render_with_direction=False),
    )
    return decoded.raw_meshes[0]

def _mesh_to_glb(mesh: TorchMesh, glb_path: Path) -> None:
    # via trimesh: write PLY → load → rotate axes → export GLB
    with tempfile.NamedTemporaryFile(suffix=".ply", delete=False) as tmp_ply:
        mesh.tri_mesh().write_ply(tmp_ply)
        tmp_ply.flush()
        tm = trimesh.load(tmp_ply.name)
        # axis fix: turn Z-up into Y-up (Blender/GLB friendly)
        rot_x = trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0])
        tm.apply_transform(rot_x)
        rot_y = trimesh.transformations.rotation_matrix(np.pi, [0, 1, 0])
        tm.apply_transform(rot_y)
        tm.export(glb_path, file_type="glb")

def _save_renders(xm, latents: List[torch.Tensor], out_dir: Path, size: int = 256) -> List[str]:
    """
    Save a small turntable of PNG frames for preview.
    """
    paths = []
    imgs = decode_latent_images(xm, latents, size=size)
    for i, pil_img in enumerate(imgs):
        p = out_dir / f"preview_{i:02d}.png"
        pil_img.save(p)
        paths.append(str(p))
    return paths
# ---------- Model holders (lazy loaded) ----------
class Models:
    xm = None
    text = None
    img = None
    diffusion = None

    @classmethod
    def ensure_text(cls):
        if cls.xm is None:
            cls.xm = load_model('transmitter', device=DEVICE)
        if cls.text is None:
            cls.text = load_model('text300M', device=DEVICE)
        if cls.diffusion is None:
            cls.diffusion = diffusion_from_config(load_config('diffusion'))

    @classmethod
    def ensure_image(cls):
        if cls.xm is None:
            cls.xm = load_model('transmitter', device=DEVICE)
        if cls.img is None:
            cls.img = load_model('image300M', device=DEVICE)
        if cls.diffusion is None:
            cls.diffusion = diffusion_from_config(load_config('diffusion'))


# ---------- Schemas ----------
class TextTask(BaseModel):
    prompt: str
    steps: int = 64
    guidance_scale: float = 15.0
    batch_size: int = 1
    seed: Optional[int] = None
    output: List[Literal["glb","ply","preview"]] = ["glb","preview"]
    up_axis: Literal["Z","Y","X"] = "Z"

class ImageTask(BaseModel):
    steps: int = 64
    guidance_scale: float = 3.0
    batch_size: int = 1
    seed: Optional[int] = None
    output: List[Literal["glb","ply","preview"]] = ["glb","preview"]
    up_axis: Literal["Z","Y","X"] = "Z"


# ---------- Routes ----------
@app.get("/health")
def health():
    return {"ok": True, "device": str(DEVICE)}

@app.post("/text")
def text_to_3d(task: TextTask):
    try:
        Models.ensure_text()
        if task.seed is not None:
            torch.manual_seed(task.seed)

        latents = sample_latents(
            batch_size=task.batch_size,
            model=Models.text,
            diffusion=Models.diffusion,
            guidance_scale=task.guidance_scale,
            model_kwargs=dict(texts=[task.prompt] * task.batch_size),
            progress=True,
            clip_denoised=True,
            use_fp16=True,
            use_karras=True,
            karras_steps=task.steps,
            sigma_min=1e-3, sigma_max=160, s_churn=0,
        )

        out = _session_dir("text3d")
        paths = []
        # previews
        if "preview" in task.output:
            paths += _save_renders(Models.xm, latents, out, size=256)

        # meshes
        for bi, latent in enumerate(latents):
            mesh = _decode_latent_mesh(Models.xm, latent)
            if "glb" in task.output:
                _mesh_to_glb(mesh, out / f"mesh_{bi:02d}.glb")
                paths.append(str(out / f"mesh_{bi:02d}.glb"))
            if "ply" in task.output:
                ply_path = out / f"mesh_{bi:02d}.ply"
                mesh.tri_mesh().write_ply(ply_path)
                paths.append(str(ply_path))

        meta = {
            "mode": "text",
            "prompt": task.prompt,
            "steps": task.steps,
            "guidance_scale": task.guidance_scale,
            "batch_size": task.batch_size,
            "seed": task.seed,
            "device": str(DEVICE),
            "out_dir": str(out),
            "files": paths,
        }
        (out / "meta.json").write_text(json.dumps(meta, indent=2))
        return JSONResponse(meta)
    except Exception as e:
        raise HTTPException(500, f"Shap-E text generation error: {e}")
@app.post("/image")
async def image_to_3d(
    image: UploadFile = File(...),
    steps: int = Form(64),
    guidance_scale: float = Form(3.0),
    batch_size: int = Form(1),
    seed: Optional[int] = Form(None),
    output: str = Form("glb,preview"),
):
    try:
        Models.ensure_image()
        if seed is not None:
            torch.manual_seed(seed)

        # read image
        data = await image.read()
        pil = Image.open(io.BytesIO(data)).convert("RGB")
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as t:
            pil.save(t.name)
            img_in = shap_e_load_image(t.name)

        outs = output.split(",") if output else ["glb","preview"]

        latents = sample_latents(
            batch_size=batch_size,
            model=Models.img,
            diffusion=Models.diffusion,
            guidance_scale=guidance_scale,
            model_kwargs=dict(images=[img_in] * batch_size),
            progress=True,
            clip_denoised=True,
            use_fp16=True,
            use_karras=True,
            karras_steps=steps,
            sigma_min=1e-3, sigma_max=160, s_churn=0,
        )

        out = _session_dir("img3d")
        paths = []
        if "preview" in outs:
            paths += _save_renders(Models.xm, latents, out, size=256)

        for bi, latent in enumerate(latents):
            mesh = _decode_latent_mesh(Models.xm, latent)
            if "glb" in outs:
                _mesh_to_glb(mesh, out / f"mesh_{bi:02d}.glb")
                paths.append(str(out / f"mesh_{bi:02d}.glb"))
            if "ply" in outs:
                ply_path = out / f"mesh_{bi:02d}.ply"
                mesh.tri_mesh().write_ply(ply_path)
                paths.append(str(ply_path))

        meta = {
            "mode": "image",
            "filename": image.filename,
            "steps": steps,
            "guidance_scale": guidance_scale,
            "batch_size": batch_size,
            "seed": seed,
            "device": str(DEVICE),
            "out_dir": str(out),
            "files": paths,
        }
        (out / "meta.json").write_text(json.dumps(meta, indent=2))
        return JSONResponse(meta)
    except Exception as e:
        raise HTTPException(500, f"Shap-E image generation error: {e}")
