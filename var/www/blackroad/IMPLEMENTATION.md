# Implementation Guide

## Prerequisites
- Docker and docker-compose
- Python 3.11 for running pipelines locally

## Local Development
```bash
docker compose up -d
curl -f http://localhost:9000/healthz
```

### Batch Pipeline
```bash
python pipelines/batch/run_batch.py --input ./data/input --output ./data/output
```

### Hyperparameter Tuning
```bash
python pipelines/tuning/hpo.py --trials 5
```
Results are written to `./data/tuning` and logs to `./logs`.

## CI/CD
Set GitHub secrets:
- `GHCR_USERNAME`
- `GHCR_TOKEN`

The workflow `mlops.yml` builds and optionally pushes `ghcr.io/<GHCR_USERNAME>/blackroad-inference:latest`.
Trigger manually with `gh workflow run mlops.yml` or on every push/PR affecting `var/www/blackroad/**`.

## GPU Notes
To enable GPU inference, install `onnxruntime-gpu` or `torch` and add `--gpus all` to `docker compose` and modify the Dockerfile to use the appropriate packages.
