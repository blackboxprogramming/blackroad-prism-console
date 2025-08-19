import argparse
import json
import logging
import random
from pathlib import Path

def train_model(lr: float, batch_size: int) -> float:
    return 1.0 / (lr * batch_size + 1e-6)

def main() -> None:
    parser = argparse.ArgumentParser(description="Hyperparameter tuning")
    parser.add_argument("--trials", type=int, default=5, help="Number of random trials")
    parser.add_argument("--logdir", type=Path, default=Path("./logs"), help="Log directory")
    parser.add_argument("--outdir", type=Path, default=Path("./data/tuning"), help="Output directory")
    args = parser.parse_args()

    args.logdir.mkdir(parents=True, exist_ok=True)
    args.outdir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(filename=args.logdir / "tuning.log", level=logging.INFO)

    search_space = {"lr": [0.001, 0.01, 0.1], "batch_size": [16, 32, 64]}

    results = []
    for _ in range(args.trials):
        params = {k: random.choice(v) for k, v in search_space.items()}
        score = train_model(params["lr"], params["batch_size"])
        logging.info("Trial params=%s score=%f", params, score)
        results.append({"params": params, "score": score})

    (args.outdir / "results.json").write_text(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
