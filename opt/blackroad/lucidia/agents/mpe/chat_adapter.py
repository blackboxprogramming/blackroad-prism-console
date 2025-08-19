#!/usr/bin/env python3
"""
Minimal chat bridge:
Input lines like:
  scenarios
  start scenario=simple_tag episodes=5 seed=7 render=off policy=random
  start scenario=simple_spread episodes=3
  help
Emits one-line JSON for programmatic consumption.
"""
import sys, json, shlex
from env import LucidiaMPE, available_scenarios

def parse_kv(parts):
    cfg = {}
    for p in parts:
        if "=" in p:
            k, v = p.split("=", 1)
            cfg[k.strip()] = v.strip()
    return cfg

def to_bool(s):
    return s.lower() in ("1","true","yes","on")

def handle(line: str):
    line = line.strip()
    if not line:
        return {"ok": True, "echo": ""}
    if line == "help":
        return {"ok": True, "help": "commands: scenarios | start scenario=<name> [episodes=N seed=S render=off|human policy=random|zeros]"}
    if line == "scenarios":
        return {"ok": True, "scenarios": available_scenarios()}

    if line.startswith("start"):
        parts = shlex.split(line)
        cfg = parse_kv(parts[1:])
        scenario = cfg.get("scenario", "simple_tag")
        episodes = int(cfg.get("episodes", 3))
        seed = int(cfg["seed"]) if "seed" in cfg else None
        render = cfg.get("render", "off")
        policy = cfg.get("policy", "random")
        env = LucidiaMPE(
            scenario=scenario,
            render_mode=None if render=="off" else "human",
        )
        res = env.run_episodes(episodes=episodes, policy=policy, episode_tag=f"chat-{scenario}")
        return {"ok": True, "result": res}

    return {"ok": False, "error": f"unknown command: {line}"}

def main():
    for raw in sys.stdin:
        try:
            out = handle(raw)
        except Exception as e:
            out = {"ok": False, "error": repr(e)}
        sys.stdout.write(json.dumps(out, separators=(",", ":")) + "\n")
        sys.stdout.flush()

if __name__ == "__main__":
    main()
