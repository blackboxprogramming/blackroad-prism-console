#!/usr/bin/env python3
import math, json, sys, pathlib, yaml

CFG_PATH = "/etc/blackroad/love.yaml"
cfg = yaml.safe_load(open(CFG_PATH)) if pathlib.Path(CFG_PATH).exists() else {
  "epsilon":1e-4,"bias":0.0,
  "weights":{"positive":{"truth":2,"consent":1.6,"benefit":1.4,"reciprocity":1.2,"transparency":1.0,"reversibility":0.8},
             "negative":{"harm":2.2,"coercion":2.0,"scarcity":0.8,"deception":1.4}}
}

def clamp01(x): return max(0.0, min(1.0, float(x)))
def lift(x, eps): x=clamp01(x); return math.log((x+eps)/((1-x)+eps))
def sig(z): return 1/(1+math.exp(-z))

def love(f):
  e=cfg["epsilon"]; w=cfg["weights"]; b=cfg.get("bias",0.0)
  t=lift(f.get("truth",0.5),e); c=lift(f.get("consent",0.5),e); ben=lift(f.get("benefit",0.5),e)
  r=lift(f.get("reciprocity",0.5),e); y=lift(f.get("transparency",0.5),e); v=lift(f.get("reversibility",0.5),e)
  h=lift(f.get("harm",0.0),e); q=lift(f.get("coercion",0.0),e); s=lift(f.get("scarcity",0.0),e); d=lift(f.get("deception",0.0),e)
  harm_term = w["negative"]["harm"] * (h / max(0.25, 1 + f.get("reversibility",0.5)))
  z = b + w["positive"]["truth"]*t + w["positive"]["consent"]*c + w["positive"]["benefit"]*ben \
        + w["positive"]["reciprocity"]*r + w["positive"]["transparency"]*y + w["positive"]["reversibility"]*v \
        - harm_term - w["negative"]["coercion"]*q - w["negative"]["scarcity"]*s - w["negative"]["deception"]*d
  L=sig(z)
  if f.get("truth",0.5) < 0.1: L=min(L,0.05)
  return {"L":L,"z":z}

if __name__=="__main__":
  data=json.load(sys.stdin)
  print(json.dumps(love(data), indent=2))
