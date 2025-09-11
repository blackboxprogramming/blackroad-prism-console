# BlackRoad MLOps Stack

## Microsoft/AI Submodule Inventory

| Submodule | Purpose | Primary Stack | Last Commit | Repo |
|-----------|---------|---------------|-------------|------|
| AI100 | Introductory AI curricula for newcomers | Python, Jupyter | 2024-05-10 | https://github.com/microsoft/AI-100 |
| AI200 | Intermediate machine learning and data workflows | Python, Jupyter | 2024-05-15 | https://github.com/microsoft/AI-200 |
| AI300 | Advanced applied AI with MLOps, Recommenders, NLP, CV | Python, PyTorch | 2024-05-20 | https://github.com/microsoft/AI-300 |

## Prioritized Modules for BlackRoad
- **AI300/MLOps** – pipelines and deployment practices align with our production goals.
- **AI300/Recommenders** – provides templates for personalization services.
- **AI300/NLP** – useful for text-heavy agents like Roadie and Contradiction.
- **AI300/ComputerVision** – basis for future vision capabilities in Guardian.

## Lucidia Agent Mapping
- **Guardian** – health checks and monitoring inspired by AI300 MLOps patterns.
- **Roadie** – batch processing and recommender flows derived from AI300 Recommenders.
- **Contradiction** – NLP models and evaluation techniques from AI300/NLP.

## Quickstart
1. `make build` – build the inference image.
2. `make run` – start the service and expose it on [http://localhost:9000](http://localhost:9000).
3. `curl http://localhost:9000/healthz` – service health.
4. `curl -X POST http://localhost:9000/v1/infer -d '{"input":"hello"}' -H 'Content-Type: application/json'` – sample inference.
5. `curl -sN http://localhost:9000/v1/stream` – streamed output.

## Pipelines
- `make batch` – runs batch inference over `./data/input` into `./data/output`.
- `make tune` – random-search hyperparameter tuning storing results in `./logs` and `./data/tuning`.

## CI/CD
GitHub Actions workflow (`mlops.yml`) lints, tests, builds, and optionally pushes the container to GHCR when `GHCR_USERNAME` and `GHCR_TOKEN` secrets are set.


_Last updated on 2025-09-11_
