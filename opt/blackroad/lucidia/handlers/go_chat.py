# FILE: /opt/blackroad/lucidia/handlers/go_chat.py
# Desc: Very light NL → action parser so users can talk casually; Codex can do better.
import re, requests

API = "http://127.0.0.1:8088"

def parse_user(text:str):
    t = text.strip().lower()
    # Examples:
    # "new 9x9", "new 19x19 komi 7.5", "play b d4", "genmove black"
    if t.startswith("new"):
        m = re.search(r'(\d{1,2})x\1', t)
        size = int(m.group(1)) if m else 19
        m2 = re.search(r'komi\s+([0-9.]+)', t)
        komi = float(m2.group(1)) if m2 else 6.5
        return ("new", {"size":size,"komi":komi})
    if t.startswith("play"):
        m = re.findall(r'\b([bw])\b[^a-z0-9]*([a-t]\d{1,2}|pass)', t)
        if not m: return ("err", "Say: play B D4  (or play W pass)")
        color, move = m[0]
        return ("play", {"color":color.upper(), "move":move.upper()})
    if "genmove" in t or "engine move" in t or "your move" in t:
        color = "B" if "black" in t else ("W" if "white" in t else "B")
        return ("genmove", {"to_play":color})
    if "score" in t:
        return ("score", {})
    return ("help", "Try: 'new 9x9', 'play B D4', 'genmove black', 'score'.")

def handle(user_text:str, game_id_box:dict):
    kind, payload = parse_user(user_text)
    if kind == "help": return payload
    if kind == "err":  return f"⚠️ {payload}"

    if kind == "new":
        r = requests.post(f"{API}/api/go/new", json=payload, timeout=5)
        r.raise_for_status()
        gid = r.json()["game_id"]
        game_id_box["id"] = gid
        return f"New game {payload['size']}x{payload['size']} (komi {payload['komi']}), game_id={gid}"

    gid = game_id_box.get("id")
    if not gid: return "Start with 'new 9x9' (no active game)."

    if kind == "play":
        r = requests.post(f"{API}/api/go/play", json={"game_id":gid, **payload}, timeout=5)
        return "ok" if r.ok else f"⚠️ {r.text}"
    if kind == "genmove":
        r = requests.post(f"{API}/api/go/genmove", json={"game_id":gid, **payload}, timeout=10)
        return f"{payload['to_play']} → {r.json().get('move')}" if r.ok else f"⚠️ {r.text}"
    if kind == "score":
        r = requests.get(f"{API}/api/go/score", params={"game_id":gid}, timeout=5)
        return r.json().get("score","?") if r.ok else f"⚠️ {r.text}"
