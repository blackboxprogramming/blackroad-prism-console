import os, uuid, json, time, subprocess
from pathlib import Path
from dataclasses import dataclass
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pydantic import BaseModel
import requests

DATA_DIR = Path(os.environ.get("DATA_DIR", "./data")).resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)
TORCH_DEVICE = os.environ.get("TORCH_DEVICE", "cuda")
IMAGE_BACKEND = os.environ.get("IMAGE_BACKEND", "diffusers")
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

# -------- ASR (faster-whisper) --------
_asr_model = None
def asr_load():
    global _asr_model
    if _asr_model is None:
        from faster_whisper import WhisperModel
        _asr_model = WhisperModel("medium", device=TORCH_DEVICE, compute_type="float16" if TORCH_DEVICE=="cuda" else "int8")
    return _asr_model

def asr_transcribe(wav_path: str) -> str:
    model = asr_load()
    segments, _ = model.transcribe(wav_path, vad_filter=True)
    return " ".join(seg.text.strip() for seg in segments)

# -------- Image Gen (Diffusers OR ComfyUI) --------
_pipe = None
def diffusers_load():
    global _pipe
    if _pipe is None:
        import torch
        from diffusers import StableDiffusionXLImg2ImgPipeline, StableDiffusionXLPipeline, AutoencoderKL
        base_id = os.environ.get("DIFFUSERS_MODEL", "stabilityai/stable-diffusion-xl-base-1.0")
        ref_id  = os.environ.get("DIFFUSERS_REFINER", "stabilityai/stable-diffusion-xl-refiner-1.0")
        _pipe = StableDiffusionXLPipeline.from_pretrained(base_id, torch_dtype=torch.float16 if TORCH_DEVICE=="cuda" else torch.float32).to(TORCH_DEVICE)
        try:
            _pipe_ref = StableDiffusionXLImg2ImgPipeline.from_pretrained(ref_id, torch_dtype=torch.float16 if TORCH_DEVICE=="cuda" else torch.float32).to(TORCH_DEVICE)
            _pipe.refiner = _pipe_ref
        except Exception:
            pass
    return _pipe

def generate_image_diffusers(prompt: str, negative: str = "", seed: int = None, steps: int = 30, cfg: float = 6.5, width=1024, height=1024) -> str:
    import torch
    from PIL import Image
    pipe = diffusers_load()
    generator = torch.Generator(device=TORCH_DEVICE)
    if seed is not None:
        generator = generator.manual_seed(int(seed))
    image = pipe(
        prompt=prompt, negative_prompt=negative,
        num_inference_steps=int(steps), guidance_scale=float(cfg),
        width=int(width), height=int(height), generator=generator
    ).images[0]
    out = DATA_DIR / "images" / f"{uuid.uuid4().hex}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out)
    return str(out)

def generate_image_comfyui(prompt: str, **kw) -> str:
    # Minimal ComfyUI API example; expects a simple text->image workflow loaded server-side.
    # Post to /prompt; retrieve result from /history
    import time, requests
    comfy = os.environ.get("COMFYUI_HOST", "http://comfyui:8188")
    payload = {
        "prompt": {
            "3": {"class_type":"KSampler","inputs":{"seed":kw.get("seed",0),"steps":kw.get("steps",30),"cfg":kw.get("cfg",6.5),"sampler_name":"euler","scheduler":"normal","denoise":1.0,"model":"CLIP-Vision","positive":["CLIPTextEncode","9"],"negative":["CLIPTextEncode","10"],"latent":["EmptyLatentImage","11"]}},
            "9": {"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["CLIP","12"]}},
            "10":{"class_type":"CLIPTextEncode","inputs":{"text":kw.get("negative",""),"clip":["CLIP","12"]}},
            "11":{"class_type":"EmptyLatentImage","inputs":{"width":kw.get("width",1024),"height":kw.get("height",1024),"batch_size":1}},
            "12":{"class_type":"CLIP","inputs":{"clip_name":"sdxl_clip.safetensors"}}
        }
    }
    r = requests.post(f"{comfy}/prompt", json=payload, timeout=600)
    r.raise_for_status()
    prompt_id = r.json().get("prompt_id")
    # poll
    for _ in range(120):
        hist = requests.get(f"{comfy}/history/{prompt_id}", timeout=10)
        if hist.status_code == 200 and hist.json().get("outputs"):
            # In practice you’d parse the actual output path(s); here we save the JSON and return it.
            out = DATA_DIR / "images" / f"{uuid.uuid4().hex}.json"
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(json.dumps(hist.json(), indent=2))
            return str(out)
        time.sleep(2)
    raise RuntimeError("ComfyUI generation timed out")

def generate_image(prompt: str, **kw) -> str:
    if IMAGE_BACKEND.lower() == "comfyui":
        return generate_image_comfyui(prompt, **kw)
    return generate_image_diffusers(prompt, **kw)

# -------- Chat via Ollama --------
def ollama_chat(messages):
    url = f"{OLLAMA_HOST}/api/chat"
    payload = {"model": os.environ.get("OLLAMA_MODEL","llama3.1:8b"), "messages": messages, "stream": False}
    r = requests.post(url, json=payload, timeout=600)
    r.raise_for_status()
    return r.json()["message"]["content"]

# -------- Flask app --------
app = Flask(__name__)
CORS(app)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files:
        return jsonify({"error":"no file"}), 400
    f = request.files["file"]
    tmp = DATA_DIR / "audio" / f"{uuid.uuid4().hex}.wav"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    f.save(tmp)
    text = asr_transcribe(str(tmp))
    return jsonify({"text": text})

@app.route("/chat", methods=["POST"])
def chat():
    body = request.get_json(force=True)
    messages = body.get("messages", [])
    out = ollama_chat(messages)
    return jsonify({"reply": out})

@app.route("/image", methods=["POST"])
def image():
    body = request.get_json(force=True)
    path = generate_image(
        prompt=body.get("prompt",""),
        negative=body.get("negative",""),
        seed=body.get("seed"),
        steps=body.get("steps",30),
        cfg=body.get("cfg",6.5),
        width=body.get("width",1024),
        height=body.get("height",1024),
    )
    return jsonify({"image_path": path})

@app.route("/3d/reconstruct", methods=["POST"])
def reconstruct():
    """
    Kick off Nerfstudio-based Gaussian Splatting from a directory of images.
    Returns a suggested command (you can run it inside the nerfstudio docker image) and an output folder.
    """
    body = request.get_json(force=True)
    images_dir = Path(body["images_dir"]).resolve()
    run_id = uuid.uuid4().hex[:8]
    out_dir = DATA_DIR / "splat" / run_id
    out_dir.mkdir(parents=True, exist_ok=True)

    # Suggest official Nerfstudio Docker image usage:
    # ghcr.io/nerfstudio-project/nerfstudio:latest  (official) 
    cmd = [
        "docker","run","--rm","--gpus","all",
        "-v", f"{images_dir}:/workspace/images",
        "-v", f"{out_dir}:/workspace/out",
        "-p","7007:7007",
        "ghcr.io/nerfstudio-project/nerfstudio:latest",
        "bash","-lc",
        "ns-process-data images --data /workspace/images --output-dir /workspace/out && "
        "ns-train splatfacto --data /workspace/out/processed && "
        "ns-export gaussian-splat --load-config outputs/*/config.yml --output-path /workspace/out/scene.splat"
    ]
    return jsonify({"hint": "run this command on the host to build the .splat", "command": " ".join(cmd), "output_dir": str(out_dir)})

if __name__ == "__main__":
    # Local dev runner
    from werkzeug.serving import run_simple
    run_simple("0.0.0.0", 7000, app, use_reloader=False)
