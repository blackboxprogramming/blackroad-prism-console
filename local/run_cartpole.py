"""Local ES training on CartPole."""
from __future__ import annotations

import json
import logging
import random
import signal
import sys
import time
from pathlib import Path

import click
import gymnasium
import numpy as np
import torch
from torch.utils.tensorboard import SummaryWriter

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
