# Modern Hopfield Transformer Experiment

This module trains a compact vision transformer augmented with a Modern Hopfield memory head on CIFAR-10.

## Usage
1. Install dependencies: `pip install torch torchvision torchmetrics`.
2. Launch training with the default configuration: `python -m ml.hopfield_transformer.train --epochs 20 --beta 20 --mem-size 256 --lambda-retr 0.2 --seed 0`.
3. Metrics (accuracy, retrieval AUC, rare recall) are printed each epoch and saved to `metrics.json` under the chosen `--output-dir`.
4. The best checkpoint is written to `best.pt` in the same directory.
5. Append `--run-ablation` to compute the rare-recall ablation with the Hopfield head temporarily disabled after training.
6. Launch a fresh run with `--disable-hopfield` to obtain a transformer baseline without the memory head.
