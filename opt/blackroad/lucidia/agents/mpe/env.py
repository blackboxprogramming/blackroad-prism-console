"""
Lucidia MPE unified loader + runner (OpenAI-free)
- Prefers mpe2.*_v3 (new home), falls back to pettingzoo.mpe.*_v3.
- Structured JSONL logging for BlackRoad/Lucidia.
"""
from __future__ import annotations
import os, json, time, importlib, datetime as _dt
from typing import Any, Dict, Optional, Callable

try:
    import numpy as np
except Exception as e:
    raise RuntimeError("numpy is required: pip install numpy") from e

# Known scenario base names (v3 variants exist in mpe2 & pettingzoo.mpe)
KNOWN = [
    "simple", "simple_adversary", "simple_crypto", "simple_push",
    "simple_reference", "simple_speaker_listener", "simple_spread",
    "simple_tag", "simple_world_comm"
]

def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)

def _jsonable(x):
    if x is None: return None
    if isinstance(x, (int, float, str, bool)): return x
    if isinstance(x, dict): return {k: _jsonable(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)): return [_jsonable(v) for v in x]
    if 'numpy' in type(x).__module__:
        return x.tolist()
    return str(x)

def _load_module_for(base: str):
    key = f"{base}_v3"
    # Prefer mpe2 (new package), then PettingZoo fallback
    for pkg in ("mpe2", "pettingzoo.mpe"):
        try:
            return importlib.import_module(f"{pkg}.{key}")
        except ModuleNotFoundError:
            continue
    raise ImportError(
        f"Could not import scenario '{base}'. Install 'mpe2' or 'pettingzoo[mpe]'."
    )

def available_scenarios():
    out = []
    for base in KNOWN:
        try:
            _load_module_for(base)
            out.append(base)
        except Exception:
            pass
    return sorted(set(out))

class LucidiaMPE:
    def __init__(
        self,
        scenario: str = "simple_tag",
        render_mode: Optional[str] = None,  # "human" or None
        seed: Optional[int] = None,
        log_dir: str = "/var/log/blackroad/mpe",
        meta_dir: str = "/opt/blackroad/lucidia/memory/mpe",
        max_cycles: Optional[int] = None,
        continuous_actions: Optional[bool] = None,
        local_ratio: Optional[float] = None,
        **kwargs: Any,
    ):
        self.scenario = scenario
        self.seed = seed
        self.render_mode = render_mode
        self.max_cycles = max_cycles
        self.continuous_actions = continuous_actions
        self.local_ratio = local_ratio
        self.extra_kwargs = dict(kwargs)

        _ensure_dir(log_dir)
        _ensure_dir(meta_dir)
        self.log_dir = log_dir
        self.meta_dir = meta_dir

        mod = _load_module_for(scenario)
        self._env_ctor = getattr(mod, "env")  # AEC API
        # common ctor kwargs across MPE2/PettingZoo
        ctor_kwargs = {}
        if render_mode is not None:
            ctor_kwargs["render_mode"] = render_mode
        if max_cycles is not None:
            ctor_kwargs["max_cycles"] = max_cycles
        if continuous_actions is not None:
            ctor_kwargs["continuous_actions"] = continuous_actions
        if local_ratio is not None:
            ctor_kwargs["local_ratio"] = local_ratio
        ctor_kwargs.update(self.extra_kwargs)
        self.env = self._env_ctor(**ctor_kwargs)

    def run_episodes(
        self,
        episodes: int = 3,
        policy: str = "random",
        policy_fn: Optional[Callable[[str, Any, Any], Any]] = None,
        episode_tag: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run episodes with agent_iter loop. Logs JSONL to log_dir.
        Returns a compact summary dict.
        """
        ts = _dt.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        tag = episode_tag or f"{self.scenario}-{ts}"
        out_path = os.path.join(self.log_dir, f"{tag}.jsonl")

        def choose_action(agent, obs, env):
            if policy_fn is not None:
                return policy_fn(agent, obs, env)
            if policy == "zeros":
                space = env.action_space(agent)
                if hasattr(space, "n"):
                    return 0
                return np.zeros(space.shape, dtype=space.dtype if hasattr(space, "dtype") else np.float32)
            # default random
            return env.action_space(agent).sample()

        totals = { "episodes": episodes, "by_agent": {}, "rewards": [] }
        with open(out_path, "w") as f:
            for ep in range(episodes):
                reset_kwargs = {}
                if self.seed is not None:
                    reset_kwargs["seed"] = int(self.seed) + ep
                obs_dict = self.env.reset(**reset_kwargs)
                step_idx = 0
                ep_reward = {}

                # AEC API
                for agent in self.env.agent_iter():
                    obs, rew, term, trunc, info = self.env.last()
                    ep_reward[agent] = ep_reward.get(agent, 0.0) + float(rew)

                    if term or trunc:
                        action = None
                    else:
                        action = choose_action(agent, obs, self.env)

                    self.env.step(action)

                    rec = {
                        "t": time.time(),
                        "episode": ep,
                        "step": step_idx,
                        "scenario": self.scenario,
                        "agent": agent,
                        "reward": float(rew),
                        "terminated": bool(term),
                        "truncated": bool(trunc),
                        "action": _jsonable(action),
                        "info": _jsonable(info),
                    }
                    f.write(json.dumps(rec, separators=(",", ":")) + "\n")
                    step_idx += 1

                totals["rewards"].append(ep_reward)
                for a, r in ep_reward.items():
                    totals["by_agent"][a] = totals["by_agent"].get(a, 0.0) + float(r)

        # meta drops (Lucidia memory / contradiction stubs)
        meta_blob = {
            "tag": tag,
            "scenario": self.scenario,
            "episodes": episodes,
            "agents": sorted(self.env.possible_agents) if hasattr(self.env, "possible_agents") else None,
            "log_path": out_path,
        }
        with open(os.path.join(self.meta_dir, f"{tag}.meta.json"), "w") as mf:
            mf.write(json.dumps(meta_blob, indent=2))

        return {
            "tag": tag,
            "log_path": out_path,
            "summary": {
                "episodes": episodes,
                "total_reward_by_agent": totals["by_agent"],
                "episode_rewards": totals["rewards"],
            },
        }
