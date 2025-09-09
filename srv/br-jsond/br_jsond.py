#!/usr/bin/env python3
# Universal JSON normalizer: HTTP API + CLI + (optional) FS watchers
# Deps (install below): orjson, flask, watchdog, python-magic, PyYAML, xmltodict, pillow,
#                       jsonschema (optional), tomllib (py3.11+) or tomli, numpy/pandas (optional)
import os, sys, io, re, base64, hashlib, subprocess, socket, time, datetime, uuid, json
from dataclasses import is_dataclass, asdict
from pathlib import Path
from typing import Any, Dict

# -- Optional imports (graceful fallback) --
try: import orjson
except: import json as orjson  # minimal fallback
try: import yaml  # PyYAML safe loaders
except: yaml = None
try:
    import tomllib  # py3.11+
except Exception:
    try: import tomli as tomllib  # py<3.11
    except Exception: tomllib = None
try: import xmltodict
except: xmltodict = None
try:
    import magic  # libmagic file sniffing
except Exception:
    magic = None
try:
    from PIL import Image, ExifTags
except Exception:
    Image, ExifTags = None, None
try: import numpy as np
except: np = None
try: import pandas as pd
except: pd = None
try:
    from jsonschema import validate as js_validate  # optional
except Exception:
    js_validate = None

from flask import Flask, request, jsonify

HOST = os.getenv("BR_JSOND_HOST", "127.0.0.1")
PORT = int(os.getenv("BR_JSOND_PORT", "4505"))
WATCHCFG = os.getenv("BR_JSOND_WATCH", "/etc/br-jsond/watch.yaml")
ORIGIN_KEY_PATH = os.getenv("ORIGIN_KEY_PATH", "/srv/secrets/origin.key")

def _now_iso():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()

def _sha256_bytes(b: bytes) -> str:
    h = hashlib.sha256(); h.update(b); return h.hexdigest()

# ---------- Normalization core ----------
SECRET_KEYS = re.compile(r"(password|secret|api[_-]?key|token|authorization|passphrase)", re.I)
MAX_INLINE_BYTES = int(os.getenv("BR_JSOND_MAX_INLINE_BYTES", "262144"))  # 256 KiB

def redact(obj: Any) -> Any:
    """Mask secrets by key name; recurse into dict/list."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if isinstance(k, str) and SECRET_KEYS.search(k):
                out[k] = "***REDACTED***"
            else:
                out[k] = redact(v)
        return out
    if isinstance(obj, list):
        return [redact(x) for x in obj]
    return obj

def default_orjson(o):
    # dataclass
    if is_dataclass(o): return asdict(o)
    # numpy
    if np is not None:
        if isinstance(o, np.ndarray):
            return {"__ndarray__": True, "shape": o.shape, "dtype": str(o.dtype), "data": o.tolist()}
        if isinstance(o, (np.integer,)): return int(o)
        if isinstance(o, (np.floating,)): return float(o)
    # pandas
    if pd is not None and isinstance(o, pd.DataFrame):
        return {"__dataframe__": True, "orient":"records", "data": json.loads(o.to_json(orient="records"))}
    # pillow image
    if Image is not None and isinstance(o, Image.Image):
        return {"__image__": True, "mode": o.mode, "size": o.size}
    # pathlib, UUID, datetime
    if isinstance(o, Path): return str(o)
    if isinstance(o, uuid.UUID): return str(o)
    if isinstance(o, (datetime.datetime, datetime.date)):
        return o.isoformat()
    # bytes (short -> base64, long -> hex digest pointer)
    if isinstance(o, (bytes, bytearray)):
        b = bytes(o)
        if len(b) <= MAX_INLINE_BYTES:
            return {"__bytes_b64__": base64.b64encode(b).decode("ascii")}
        return {"__bytes_ref__": {"sha256": _sha256_bytes(b), "length": len(b)}}
    # fallback
    return repr(o)

def dumps(obj, sort_keys=True) -> bytes:
    if hasattr(orjson, "dumps"):
        opt = 0
        # orjson option names guarded to avoid AttributeError
        opt |= getattr(orjson, "OPT_NON_STR_KEYS", 0)
        opt |= getattr(orjson, "OPT_SERIALIZE_DATACLASS", 0)
        opt |= getattr(orjson, "OPT_NAIVE_UTC", 0)
        opt |= getattr(orjson, "OPT_SERIALIZE_NUMPY", 0)
        if sort_keys: opt |= getattr(orjson, "OPT_SORT_KEYS", 0)
        return orjson.dumps(obj, default=default_orjson, option=opt)
    return json.dumps(obj, default=str, sort_keys=sort_keys).encode()

def loads(b: bytes) -> Any:
    if hasattr(orjson, "loads"): return orjson.loads(b)
    return json.loads(b.decode())

# ---------- File sniff + parse ----------
def detect_mime(path: str) -> str:
    if magic:
        try: return magic.from_file(path, mime=True)
        except: pass
    # fallback by extension
    ext = Path(path).suffix.lower()
    return {
        ".json": "application/json",
        ".yml": "text/yaml", ".yaml": "text/yaml",
        ".toml": "application/toml",
        ".csv": "text/csv",
        ".xml": "application/xml",
        ".jpg": "image/jpeg", ".jpeg":"image/jpeg", ".png":"image/png", ".gif":"image/gif", ".webp":"image/webp",
        ".mp3":"audio/mpeg", ".wav":"audio/wav", ".mp4":"video/mp4", ".mkv":"video/x-matroska",
        ".txt":"text/plain",
    }.get(ext, "application/octet-stream")

def parse_text(text: str, kind_hint: str | None) -> Any:
    # try JSON first
    try: return loads(text.encode())
    except: pass
    # YAML
    if yaml and (kind_hint in ("yaml","text/yaml") or text.strip().startswith(("-", "---", "{", "["))):
        try: return yaml.safe_load(text)  # safe loader only
        except: pass
    # TOML
    if tomllib and kind_hint in ("toml","application/toml"):
        try: return tomllib.loads(text)
        except: pass
    # XML
    if xmltodict and (kind_hint in ("xml","application/xml") or text.strip().startswith("<")):
        try: return xmltodict.parse(text)
        except: pass
    # CSV (first row headers)
    if kind_hint in ("csv","text/csv"):
        import csv
        rdr = csv.DictReader(io.StringIO(text))
        return list(rdr)
    # fallback: plain text
    return {"__text__": text}

def ffprobe_meta(path: str) -> Dict[str, Any]:
    # Requires ffprobe in PATH
    try:
        cmd = ["ffprobe","-v","quiet","-print_format","json","-show_format","-show_streams", path]
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, timeout=10)
        return loads(out)
    except Exception as e:
        return {"error": str(e)}

def image_meta(path: str) -> Dict[str, Any]:
    if not Image: return {"error":"Pillow not installed"}
    try:
        with Image.open(path) as im:
            info = {"format": im.format, "mode": im.mode, "size": im.size}
            if hasattr(im, "_getexif") and im._getexif():
                exif_raw = {ExifTags.TAGS.get(k,k): v for k,v in im._getexif().items()}
                info["exif"] = exif_raw
            return info
    except Exception as e:
        return {"error": str(e)}

def load_file(path: str) -> Dict[str, Any]:
    p = Path(path)
    if not p.exists(): raise FileNotFoundError(path)
    mime = detect_mime(path)
    size = p.stat().st_size
    meta = {"path": str(p), "mime": mime, "size": size}
    # Text-ish
    if mime.startswith("text/") or mime in ("application/json","application/xml","application/toml"):
        with open(path, "rb") as f: b = f.read()
        text = b.decode(errors="replace")
        data = parse_text(text, kind_hint=mime.split("/")[-1])
        return {"kind": "textlike", "meta": meta, "data": data}
    # Images
    if mime.startswith("image/"):
        return {"kind":"image", "meta": {**meta, **image_meta(path)}, "data": {"file": str(p)}}
    # Audio/Video
    if mime.startswith("audio/") or mime.startswith("video/"):
        return {"kind":"av", "meta": {**meta, "ffprobe": ffprobe_meta(path)}, "data": {"file": str(p)}}
    # Binary fallback
    with open(path, "rb") as f: b = f.read(min(size, MAX_INLINE_BYTES+1))
    if len(b) <= MAX_INLINE_BYTES:
        return {"kind":"binary", "meta": {**meta, "sha256": _sha256_bytes(open(path,"rb").read())},
                "data": {"bytes_b64": base64.b64encode(open(path,"rb").read()).decode("ascii")}}
    else:
        return {"kind":"binary", "meta": {**meta, "sha256": _sha256_bytes(open(path,"rb").read())}, "data": {"file": str(p)}}

def envelope(payload: Any, source: str|None=None, kind: str|None=None, schema: Dict|None=None) -> Dict[str, Any]:
    host = socket.gethostname()
    env = {
        "meta": {
            "ts": _now_iso(),
            "host": host,
            "source": source,
            "kind": kind,
        },
        "data": redact(payload)
    }
    if schema: env["schema"] = schema
    return env

def canonical_jcs(obj: Any) -> str:
    """
    Best-effort canonical JSON. Full RFC 8785 requires strict number/escape rules.
    Here we sort keys deterministically; for cryptographic use, prefer a dedicated JCS lib.
    """
    return dumps(obj, sort_keys=True).decode()

# ---------- Flask app ----------
app = Flask(__name__)

def read_origin_key() -> str:
    try: return Path(ORIGIN_KEY_PATH).read_text().strip()
    except: return ""

def post_backplane(path, obj):
    import urllib.request, urllib.error
    data = dumps(obj)
    req = urllib.request.Request(path, data=data, headers={
        "Content-Type":"application/json",
        "X-BlackRoad-Key": read_origin_key()
    })
    try: urllib.request.urlopen(req, timeout=5)
    except Exception: pass

@app.get("/health")
def health(): return {"ok": True, "ts": _now_iso()}

@app.post("/normalize")
def http_normalize():
    """
    Request body options:
      - {"path": "/path/to/file"}  -> auto-detect, parse, envelope
      - {"text": "...", "kind": "yaml|toml|xml|csv|json"} -> parse text
      - {"data": <arbitrary JSON-able>} -> envelope
      - {"backplane": {"device":"pi-01","as":"telemetry"}} -> POST to devices backplane
      - {"schema": {...}} -> validate (if jsonschema installed)
    """
    raw = request.get_data() or b"{}"
    try: body = loads(raw)
    except: return jsonify({"error":"invalid json"}), 400

    schema = body.get("schema")
    obj = None; src=None; kind=None

    if body.get("path"):
        res = load_file(body["path"])
        obj = res["data"]; kind = res.get("kind"); src = body["path"]
    elif "text" in body:
        obj = parse_text(body["text"], body.get("kind")); kind = body.get("kind") or "text"
    elif "data" in body:
        obj = body["data"]; kind = "object"; src = "inline"
    else:
        return jsonify({"error":"nothing to normalize"}), 400

    # schema validation (optional)
    if schema and js_validate:
        try: js_validate(obj, schema)
        except Exception as e:
            return jsonify({"error": f"schema_validation_failed: {e}"}), 422

    env = envelope(obj, source=src, kind=kind)
    env["canonical"] = canonical_jcs(env["data"])

    # Optional backplane forward
    bp = body.get("backplane")
    if isinstance(bp, dict):
        device = bp.get("device")
        as_ = bp.get("as","telemetry")
        if device:
            url = f"http://127.0.0.1:4000/api/devices/{device}/{as_}"
            post_backplane(url, {"id":device,"role":as_,"payload":env})

    return app.response_class(dumps(env), mimetype="application/json")

@app.post("/file")
def http_file():
    body = loads(request.get_data() or b"{}")
    if not body.get("path"): return jsonify({"error":"path required"}), 400
    res = load_file(body["path"])
    env = envelope(res["data"], source=body["path"], kind=res.get("kind"))
    return app.response_class(dumps(env), mimetype="application/json")

# ---------- Watchers (optional) ----------
class _WatchHandler:
    def __init__(self, rule): self.rule=rule
    def on_any_event(self, event):
        try:
            if event.is_directory: return
            p = event.src_path
            patt = self.rule.get("glob")
            if patt and not Path(p).match(patt): return
            res = load_file(p)
            env = envelope(res["data"], source=p, kind=res.get("kind"))
            # route: devices backplane or file
            if self.rule.get("post"):
                post_backplane(self.rule["post"], env)
            elif self.rule.get("write_dir"):
                outdir = Path(self.rule["write_dir"]); outdir.mkdir(parents=True, exist_ok=True)
                outpath = outdir / (Path(p).name + ".json")
                outpath.write_bytes(dumps(env))
        except Exception as e:
            sys.stderr.write(f"[watch] error {e}\n")

def start_watchers():
    if not WATCHCFG or not Path(WATCHCFG).exists(): return
    cfg = {}
    if yaml:
        try: cfg = yaml.safe_load(Path(WATCHCFG).read_text()) or {}
        except Exception: cfg = {}
    if not cfg.get("watch"): return
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    obs = Observer()
    for rule in cfg["watch"]:
        path = rule.get("path"); 
        if not path or not Path(path).exists(): continue
        hdl = _WatchHandler(rule)
        # Simple inline subclass to connect our handler
        class H(FileSystemEventHandler):
            def on_any_event(self, event): hdl.on_any_event(event)
        obs.schedule(H(), path, recursive=True)
        sys.stderr.write(f"[watch] watching {path}\n")
    obs.daemon=True; obs.start()

def main():
    if len(sys.argv) > 1 and sys.argv[1] in ("-f","--file"):
        # CLI one-shot convert
        path = sys.argv[2]
        res = load_file(path)
        env = envelope(res["data"], source=path, kind=res.get("kind"))
        sys.stdout.buffer.write(dumps(env, sort_keys=True) + b"\n")
        return
    # run server
    start_watchers()
    app.run(host=HOST, port=PORT)

if __name__ == "__main__":
    main()
