# mypy: ignore-errors
"""Run Evolution Strategies training on CartPole-v1 locally."""

from __future__ import annotations

import argparse
"""Local ES training on CartPole."""
from __future__ import annotations

import json
import logging
import random
import signal
import time
from pathlib import Path

import gymnasium as gym
import sys
import time
from pathlib import Path

import click
import gymnasium
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
from .es_core import perturb, evaluate, estimate_gradient, update
from .models import MLPPolicy, flatten_params, unflatten_params


@click.command()
@click.option("--iterations", default=200, type=int, help="Number of ES iterations")
@click.option("--timesteps", default=None, type=int, help="Alias for --iterations")
@click.option("--popsize", default=64, type=int, help="Population size")
@click.option("--sigma", default=0.1, type=float, help="Noise standard deviation")
@click.option("--lr", default=0.02, type=float, help="Learning rate")
@click.option("--seed", default=0, type=int, help="Random seed")
@click.option("--eval-episodes", default=5, type=int, help="Evaluation episodes")
@click.option("--resume", type=click.Path(exists=True), default=None, help="Resume from checkpoint")
@click.option("--checkpoint-interval", default=10, type=int, help="Checkpoint interval")
def main(iterations: int, timesteps: int | None, popsize: int, sigma: float, lr: float, seed: int,
         eval_episodes: int, resume: str | None, checkpoint_interval: int) -> None:
    if timesteps is not None:
        iterations = timesteps

    run_dir = Path("runs/es_local")
    run_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(run_dir / "train.log"),
        ],
    )
    logger = logging.getLogger("es")

    writer = SummaryWriter(str(run_dir))

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    generator = torch.Generator().manual_seed(seed)

    env_name = "CartPole-v1"
    env = gymnasium.make(env_name)
    obs_dim = env.observation_space.shape[0]
    act_dim = env.action_space.n
    env.close()

    model = MLPPolicy(obs_dim, act_dim)
    params = flatten_params(model)
    start_iter = 0
    if resume is not None:
        ckpt = torch.load(resume)
        params = ckpt["params"]
        start_iter = ckpt.get("iteration", 0)
        unflatten_params(model, params)
        logger.info(f"Resumed from {resume} at iteration {start_iter}")

    ckpt_dir = Path("checkpoints/es_cartpole")
    ckpt_dir.mkdir(parents=True, exist_ok=True)

    stop = False

    def handle_sigint(sig, frame):  # type: ignore[unused-argument]
        nonlocal stop
        stop = True
        logger.info("SIGINT received, will save checkpoint and exit")

    signal.signal(signal.SIGINT, handle_sigint)

    num_params = params.numel()

    for iteration in range(start_iter, iterations):
        start = time.time()
        noises = torch.randn(popsize, num_params, generator=generator)
        rewards_pos = torch.zeros(popsize)
        rewards_neg = torch.zeros(popsize)

        for i in range(popsize):
            pos_params, neg_params = perturb(params, noises[i], sigma)
            rewards_pos[i] = evaluate(env_name, model, pos_params, episodes=1, seed=seed + i * 2)
            rewards_neg[i] = evaluate(env_name, model, neg_params, episodes=1, seed=seed + i * 2 + 1)

        grad = estimate_gradient(noises, rewards_pos, rewards_neg, sigma)
        params = update(params, grad, lr, weight_decay=0.005)
        unflatten_params(model, params)

        avg_reward = evaluate(env_name, model, params, episodes=eval_episodes, seed=seed + 1234 + iteration)
        duration = time.time() - start
        writer.add_scalar("reward/average", avg_reward, iteration)
        writer.add_scalar("hyper/lr", lr, iteration)
        writer.add_scalar("hyper/sigma", sigma, iteration)
        writer.add_scalar("time/iteration", duration, iteration)
        logger.info(f"iter {iteration} avg_reward={avg_reward:.2f} time={duration:.2f}s")

        if iteration % checkpoint_interval == 0 or iteration == iterations - 1 or stop:
            ckpt_path = ckpt_dir / f"iter_{iteration:05d}.pt"
            torch.save({"params": params, "iteration": iteration}, ckpt_path)
            with open(ckpt_path.with_suffix(".json"), "w") as f:
                json.dump({"iteration": iteration, "avg_reward": float(avg_reward)}, f)
            torch.save({"params": params, "iteration": iteration}, ckpt_dir / "latest.pt")
        if stop:
            break

    writer.close()
    logger.info("training complete")


if __name__ == "__main__":
    main()
