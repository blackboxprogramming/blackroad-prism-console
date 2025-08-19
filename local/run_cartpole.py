# mypy: ignore-errors
"""Run Evolution Strategies training on CartPole-v1 locally."""

from __future__ import annotations

import argparse
import json
import logging
import random
import signal
import time
from pathlib import Path

import gymnasium as gym
import numpy as np
import torch
from torch.utils.tensorboard import SummaryWriter

from .es_core import estimate_gradient, evaluate, update
from .models import MLPPolicy, params_to_vector, vector_to_params


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="ES CartPole")
    parser.add_argument("--iterations", type=int, default=200, help="training iterations")
    parser.add_argument("--timesteps", type=int, help="alias for --iterations")
    parser.add_argument("--popsize", type=int, default=64, help="population size (even)")
    parser.add_argument("--sigma", type=float, default=0.1, help="noise stddev")
    parser.add_argument("--lr", type=float, default=0.02, help="learning rate")
    parser.add_argument("--weight-decay", type=float, default=0.005, help="weight decay")
    parser.add_argument("--seed", type=int, default=0, help="random seed")
    parser.add_argument("--eval-episodes", type=int, default=5, help="episodes for evaluation")
    parser.add_argument("--save-interval", type=int, default=10, help="checkpoint interval")
    parser.add_argument("--resume", type=str, default=None, help="path to checkpoint to resume")
    return parser.parse_args()


def save_checkpoint(directory: Path, iteration: int, params: torch.Tensor, args: argparse.Namespace, name: str | None = None) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    name = name or f"iter_{iteration}"
    state_path = directory / f"{name}_state_dict.pt"
    meta_path = directory / f"{name}.json"
    torch.save({"iteration": iteration, "params": params}, state_path)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({"iteration": iteration, "args": vars(args)}, f, indent=2)
    torch.save({"iteration": iteration, "params": params}, directory / "latest.pt")
    with open(directory / "latest.json", "w", encoding="utf-8") as f:
        json.dump({"iteration": iteration, "args": vars(args)}, f, indent=2)


def main() -> None:
    args = parse_args()
    if args.timesteps is not None:
        args.iterations = args.timesteps

    if args.popsize % 2 != 0:
        raise ValueError("popsize must be even for antithetic sampling")

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    random.seed(args.seed)

    env = gym.make("CartPole-v1")
    obs_dim = env.observation_space.shape[0]
    act_dim = env.action_space.n
    policy = MLPPolicy(obs_dim, act_dim)
    params = params_to_vector(policy)
    start_iter = 0
    if args.resume is not None:
        ckpt = torch.load(args.resume)
        params = ckpt["params"]
        start_iter = int(ckpt.get("iteration", 0))
        vector_to_params(params, policy)

    log_dir = Path("runs/es_local")
    log_dir.mkdir(parents=True, exist_ok=True)
    writer = SummaryWriter(log_dir)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(log_dir / "train.log"),
        ],
    )

    checkpoint_dir = Path("checkpoints/es_cartpole")
    generator = torch.Generator().manual_seed(args.seed)

    stop = {"flag": False}

    def handle_sigint(signum, frame):
        stop["flag"] = True

    signal.signal(signal.SIGINT, handle_sigint)

    for iteration in range(start_iter, args.iterations):
        t0 = time.time()
        noises = torch.randn(args.popsize // 2, params.numel(), generator=generator)
        rewards_pos = torch.empty(args.popsize // 2)
        rewards_neg = torch.empty(args.popsize // 2)
        for i, noise in enumerate(noises):
            base_seed = args.seed + iteration * args.popsize + i * 2
            r_pos = evaluate(env, policy, params + args.sigma * noise, 1, base_seed)
            r_neg = evaluate(env, policy, params - args.sigma * noise, 1, base_seed + 1)
            rewards_pos[i] = r_pos
            rewards_neg[i] = r_neg
        grad = estimate_gradient(noises, rewards_pos, rewards_neg, args.sigma)
        params = update(params, grad, args.lr, args.weight_decay)
        vector_to_params(params, policy)
        avg_reward = evaluate(env, policy, params, args.eval_episodes, args.seed + iteration)
        step_time = time.time() - t0
        writer.add_scalar("avg_reward", avg_reward, iteration)
        writer.add_scalar("lr", args.lr, iteration)
        writer.add_scalar("sigma", args.sigma, iteration)
        writer.add_scalar("step_time", step_time, iteration)
        logging.info("iter %d avg_reward %.2f", iteration, avg_reward)
        if (iteration + 1) % args.save_interval == 0:
            save_checkpoint(checkpoint_dir, iteration + 1, params, args)
        if stop["flag"]:
            logging.info("SIGINT received, saving checkpoint and exiting")
            save_checkpoint(checkpoint_dir, iteration + 1, params, args, name="interrupted")
            break
    writer.close()


if __name__ == "__main__":
    main()
