"""Command-line entry point for training the Hopfield transformer on CIFAR-10."""

from __future__ import annotations

import argparse
import math
from pathlib import Path
from typing import Dict, Tuple

import torch
import torch.nn.functional as F
from torch import Tensor
from torch.optim import AdamW
from torch.optim.lr_scheduler import LambdaLR
from torch.utils.data import DataLoader
from torchmetrics.classification import BinaryAUROC, MulticlassAccuracy
from torchvision import datasets, transforms

from .models import HopfieldVisionTransformer
from .utils import (
    CIFAR_MEAN,
    CIFAR_STD,
    MemoryDescription,
    build_dataloaders,
    build_memory_description,
    class_to_memory_indices,
    evaluate_rare_recall,
    save_metrics,
    sample_memory_indices,
    set_seed,
)

NUM_CLASSES = 10


def build_scheduler(
    optimizer: AdamW,
    epochs: int,
    steps_per_epoch: int,
    warmup_epochs: int,
) -> LambdaLR:
    """Construct a cosine-decay learning rate schedule with linear warmup."""
    total_steps = epochs * steps_per_epoch
    warmup_steps = max(1, warmup_epochs * steps_per_epoch)

    def lr_lambda(step: int) -> float:
        if step < warmup_steps:
            return float(step + 1) / float(warmup_steps)
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1.0 + math.cos(math.pi * progress))

    return LambdaLR(optimizer, lr_lambda)


def compute_retrieval_auc(logits: Tensor, targets: Tensor) -> Tuple[Tensor, Tensor]:
    """Return positive/negative scores for binary AUC computation."""
    probs = torch.softmax(logits, dim=1)
    positives = probs[torch.arange(probs.size(0), device=probs.device), targets]
    mask = F.one_hot(targets, num_classes=probs.size(1)).bool()
    negative_scores = probs.masked_fill(mask, -1.0)
    negatives = negative_scores.max(dim=1).values.clamp(min=0.0)
    preds = torch.cat([positives, negatives], dim=0)
    labels = torch.cat([
        torch.ones_like(positives),
        torch.zeros_like(negatives),
    ])
    return preds.detach().cpu(), labels.detach().cpu()


def train_one_epoch(
    model: HopfieldVisionTransformer,
    loader: DataLoader,
    optimizer: AdamW,
    scheduler: LambdaLR,
    device: torch.device,
    memory_desc: MemoryDescription,
    lambda_retrieval: float,
    use_amp: bool,
    scaler: torch.cuda.amp.GradScaler,
) -> Dict[str, float]:
    """Train the model for one epoch and aggregate core metrics."""
    model.train()
    train_mapping = class_to_memory_indices(memory_desc)
    accuracy_metric = MulticlassAccuracy(num_classes=NUM_CLASSES).to(device)
    retrieval_accuracy = None
    retrieval_auc = None
    if not model.disable_hopfield:
        retrieval_accuracy = MulticlassAccuracy(num_classes=model.hopfield.mem_size).to(device)
        retrieval_auc = BinaryAUROC()
    total_loss = 0.0
    ce_loss_total = 0.0
    retrieval_loss_total = 0.0
    energy_total = 0.0
    steps = 0
    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)
        memory_indices = None
        if not model.disable_hopfield:
            memory_indices = sample_memory_indices(labels, train_mapping)
        optimizer.zero_grad(set_to_none=True)
        with torch.cuda.amp.autocast(enabled=use_amp):
            outputs = model(images, memory_indices=memory_indices)
            ce_loss = F.cross_entropy(outputs["logits"], labels)
            loss = ce_loss
            retrieval_loss = torch.tensor(0.0, device=device)
            if not model.disable_hopfield and memory_indices is not None:
                retrieval_logits = outputs["memory_logits"]
                retrieval_loss = F.cross_entropy(retrieval_logits, memory_indices)
                loss = loss + lambda_retrieval * retrieval_loss
        if use_amp:
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            optimizer.step()
        scheduler.step()
        if not model.disable_hopfield and memory_indices is not None:
            model.write_memory(outputs["cls"].detach(), memory_indices.detach())
        accuracy_metric.update(outputs["logits"], labels)
        if not model.disable_hopfield and memory_indices is not None:
            retrieval_accuracy.update(outputs["memory_logits"], memory_indices)
            if retrieval_auc is not None:
                preds, labels_auc = compute_retrieval_auc(outputs["memory_logits"], memory_indices)
                retrieval_auc.update(preds, labels_auc)
            energy_total += outputs["hopfield_energy"].detach().sum().item()
        total_loss += loss.detach().item()
        ce_loss_total += ce_loss.detach().item()
        retrieval_loss_total += float(retrieval_loss.detach().item())
        steps += 1
    metrics: Dict[str, float] = {
        "loss": total_loss / steps,
        "ce_loss": ce_loss_total / steps,
        "accuracy": float(accuracy_metric.compute().item()),
    }
    accuracy_metric.reset()
    if not model.disable_hopfield and retrieval_accuracy is not None and retrieval_auc is not None:
        metrics["retrieval_loss"] = retrieval_loss_total / steps
        metrics["retrieval_accuracy"] = float(retrieval_accuracy.compute().item())
        metrics["retrieval_auc"] = float(retrieval_auc.compute().item())
        metrics["energy"] = energy_total / steps
        retrieval_accuracy.reset()
        retrieval_auc.reset()
    return metrics


@torch.no_grad()
def evaluate(
    model: HopfieldVisionTransformer,
    loader: DataLoader,
    device: torch.device,
    memory_desc: MemoryDescription,
) -> Dict[str, float]:
    """Evaluate classification and retrieval metrics on a data loader."""
    model.eval()
    eval_mapping = class_to_memory_indices(memory_desc)
    accuracy_metric = MulticlassAccuracy(num_classes=NUM_CLASSES).to(device)
    retrieval_accuracy = None
    retrieval_auc = None
    total_loss = 0.0
    ce_loss_total = 0.0
    retrieval_loss_total = 0.0
    energy_total = 0.0
    steps = 0
    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)
        memory_indices = None
        if not model.disable_hopfield:
            memory_indices = sample_memory_indices(labels, eval_mapping)
        outputs = model(images, memory_indices=memory_indices)
        loss = F.cross_entropy(outputs["logits"], labels)
        total_loss += loss.item()
        ce_loss_total += loss.item()
        accuracy_metric.update(outputs["logits"], labels)
        if not model.disable_hopfield and memory_indices is not None:
            logits = outputs["memory_logits"]
            retrieval_loss = F.cross_entropy(logits, memory_indices)
            retrieval_loss_total += retrieval_loss.item()
            if retrieval_accuracy is None:
                retrieval_accuracy = MulticlassAccuracy(num_classes=model.hopfield.mem_size).to(device)
                retrieval_auc = BinaryAUROC()
            retrieval_accuracy.update(logits, memory_indices)
            if retrieval_auc is not None:
                preds, labels_auc = compute_retrieval_auc(logits, memory_indices)
                retrieval_auc.update(preds, labels_auc)
            energy_total += outputs["hopfield_energy"].detach().sum().item()
        steps += 1
    metrics: Dict[str, float] = {
        "loss": total_loss / steps,
        "ce_loss": ce_loss_total / steps,
        "accuracy": float(accuracy_metric.compute().item()),
    }
    accuracy_metric.reset()
    if not model.disable_hopfield and retrieval_accuracy is not None and retrieval_auc is not None:
        metrics["retrieval_loss"] = retrieval_loss_total / steps
        metrics["retrieval_accuracy"] = float(retrieval_accuracy.compute().item())
        metrics["retrieval_auc"] = float(retrieval_auc.compute().item())
        metrics["energy"] = energy_total / steps
        retrieval_accuracy.reset()
        retrieval_auc.reset()
    return metrics


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for the training CLI."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path.home() / ".cache" / "torch" / "datasets")
    parser.add_argument("--output-dir", type=Path, default=Path("runs/hopfield"))
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--weight-decay", type=float, default=0.05)
    parser.add_argument("--warmup-epochs", type=int, default=2)
    parser.add_argument("--beta", type=float, default=20.0)
    parser.add_argument("--mem-size", type=int, default=256)
    parser.add_argument("--lambda-retr", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--num-workers", type=int, default=4)
    parser.add_argument("--embed-dim", type=int, default=192)
    parser.add_argument("--depth", type=int, default=3)
    parser.add_argument("--heads", type=int, default=3)
    parser.add_argument("--patch-size", type=int, default=4)
    parser.add_argument("--proj-dim", type=int, default=128)
    parser.add_argument("--ema", type=float, default=0.1, help="EMA momentum for memory writes")
    parser.add_argument("--holdout-fraction", type=float, default=0.2)
    parser.add_argument("--amp", action="store_true", help="Enable mixed precision training")
    parser.add_argument("--disable-hopfield", action="store_true", help="Bypass the Hopfield memory head")
    parser.add_argument("--run-ablation", action="store_true", help="Evaluate metrics with Hopfield disabled after training")
    return parser.parse_args()


def main() -> None:
    """Entry point used when launching training via ``python -m``."""
    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    set_seed(args.seed)
    train_loader, test_loader = build_dataloaders(args.data_dir, args.batch_size, args.num_workers)
    memory_desc = build_memory_description(
        mem_size=args.mem_size,
        embed_dim=args.embed_dim,
        num_classes=NUM_CLASSES,
        seed=args.seed,
        holdout_fraction=args.holdout_fraction,
    )
    model = HopfieldVisionTransformer(
        img_size=32,
        patch_size=args.patch_size,
        in_channels=3,
        embed_dim=args.embed_dim,
        depth=args.depth,
        num_heads=args.heads,
        num_classes=NUM_CLASSES,
        hopfield_proj_dim=args.proj_dim,
        memory_init=memory_desc.memory_init,
        beta=args.beta,
        dropout=0.1,
        momentum=args.ema,
        disable_hopfield=args.disable_hopfield,
    ).to(device)
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scaler = torch.cuda.amp.GradScaler(enabled=args.amp)
    scheduler = build_scheduler(optimizer, args.epochs, len(train_loader), args.warmup_epochs)
    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    metrics_log = []
    best_acc = 0.0
    best_path = output_dir / "best.pt"
    rare_dataset = datasets.CIFAR10(root=args.data_dir, train=False, transform=None, download=True)
    normalize = transforms.Normalize(CIFAR_MEAN, CIFAR_STD)
    for epoch in range(1, args.epochs + 1):
        train_stats = train_one_epoch(
            model=model,
            loader=train_loader,
            optimizer=optimizer,
            scheduler=scheduler,
            device=device,
            memory_desc=memory_desc,
            lambda_retrieval=args.lambda_retr,
            use_amp=args.amp,
            scaler=scaler,
        )
        val_stats = evaluate(model=model, loader=test_loader, device=device, memory_desc=memory_desc)
        rare_stats = evaluate_rare_recall(
            model=model,
            device=device,
            dataset=rare_dataset,
            holdout_indices=memory_desc.holdout_indices,
            key_to_class=memory_desc.key_to_class,
            normalize_fn=normalize,
        )
        epoch_metrics = {
            "epoch": epoch,
            "train_loss": train_stats.get("loss", 0.0),
            "train_accuracy": train_stats.get("accuracy", 0.0),
            "train_retrieval_accuracy": train_stats.get("retrieval_accuracy", 0.0),
            "train_retrieval_auc": train_stats.get("retrieval_auc", 0.0),
            "val_loss": val_stats.get("loss", 0.0),
            "val_accuracy": val_stats.get("accuracy", 0.0),
            "val_retrieval_accuracy": val_stats.get("retrieval_accuracy", 0.0),
            "val_retrieval_auc": val_stats.get("retrieval_auc", 0.0),
            "rare_recall": rare_stats.accuracy,
        }
        metrics_log.append(epoch_metrics)
        print(
            f"Epoch {epoch:02d} | "
            f"train acc: {epoch_metrics['train_accuracy']:.3f} | "
            f"val acc: {epoch_metrics['val_accuracy']:.3f} | "
            f"rare recall: {epoch_metrics['rare_recall']:.3f}"
        )
        if epoch_metrics["val_accuracy"] > best_acc:
            best_acc = epoch_metrics["val_accuracy"]
            torch.save({
                "epoch": epoch,
                "model_state": model.state_dict(),
                "optimizer_state": optimizer.state_dict(),
                "metrics": epoch_metrics,
                "args": vars(args),
            }, best_path)
    save_metrics(metrics_log, output_dir)
    if args.run_ablation and not model.disable_hopfield:
        print("Running Hopfield ablation (memory disabled)...")
        model.disable_hopfield = True
        model.hopfield.disabled = True
        ablation_stats = evaluate(model=model, loader=test_loader, device=device, memory_desc=memory_desc)
        ablation_rare = evaluate_rare_recall(
            model=model,
            device=device,
            dataset=rare_dataset,
            holdout_indices=memory_desc.holdout_indices,
            key_to_class=memory_desc.key_to_class,
            normalize_fn=normalize,
        )
        print(
            f"Ablation | val acc: {ablation_stats.get('accuracy', 0.0):.3f} | "
            f"rare recall: {ablation_rare.accuracy:.3f}"
        )
    print(f"Training complete. Best validation accuracy: {best_acc:.3f}")


if __name__ == "__main__":
    main()

