#!/usr/bin/env python3
import argparse, json, sys
from env import LucidiaMPE, available_scenarios

def main():
    ap = argparse.ArgumentParser("lucidia-mpe-runner")
    ap.add_argument("--scenario", default="simple_tag", choices=available_scenarios() or ["simple_tag"],
                    help="MPE scenario base name (e.g., simple_tag)")
    ap.add_argument("--episodes", type=int, default=3)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--render", default="off", choices=["off", "human"])
    ap.add_argument("--log-dir", default="/var/log/blackroad/mpe")
    ap.add_argument("--meta-dir", default="/opt/blackroad/lucidia/memory/mpe")
    ap.add_argument("--max-cycles", type=int, default=None)
    ap.add_argument("--continuous-actions", action="store_true")
    ap.add_argument("--local-ratio", type=float, default=None)
    ap.add_argument("--policy", default="random", choices=["random","zeros"])
    args = ap.parse_args()

    env = LucidiaMPE(
        scenario=args.scenario,
        render_mode=None if args.render=="off" else "human",
        seed=args.seed,
        log_dir=args.log_dir,
        meta_dir=args.meta_dir,
        max_cycles=args.max_cycles,
        continuous_actions=args.continuous_actions,
        local_ratio=args.local_ratio,
    )
    res = env.run_episodes(episodes=args.episodes, policy=args.policy)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    sys.exit(main())
