# Alice & Lucidia Agents

Alice is a planner/critic agent and Lucidia is a world-model/memory agent.
Together they demonstrate an extendable architecture that combines
associative memory, optimal transport steering, and natural-gradient
training techniques using only open tooling.

## Architecture Overview

```
+----------------+         +------------------+
|    Alice       | <-----> |     Tools        |
| (planner)      |         | (retrieve/generate|
|                |         |  /simulate)      |
+-------+--------+         +---------+--------+
        |                            |
        v                            v
+-------+--------+         +---------+--------+
|    Lucidia     | <-----> | Modern Hopfield  |
| (world model)  |         | Memory + FAISS   |
+----------------+         +------------------+
```

- **Modern Hopfield head** augments FAISS retrieval with associative recall.
- **Natural gradient optimiser** improves Lucidia's world-model updates.
- **Schrödinger bridge steering** guides generation between latent states.
- **Manifold regularisation** enforces smooth latent geometry.

## Quickstart

```bash
python -m alice_lucidia.training.train_lucidia --epochs 1 --limit 16
python -m alice_lucidia.cli.run --config alice_lucidia/configs/default.yaml
```

Sample CLI session:

```
> goal: Provide sources on renewable energy
Plan critique: Retrieved 0 memories. Draft created; verifying constraints.
- Fetch supporting knowledge: No memory found
- Draft answer: Provide sources on renewable energy :: response
```

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `lucidia.memory_path` | Path to persisted memory JSON | `./alice_lucidia_memory.json` |
| `lucidia.encoder_model` | HF encoder backbone | `distilbert-base-uncased` |
| `lucidia.hopfield_beta` | Hopfield inverse temperature | `20` |
| `lucidia.hopfield_projection` | Hopfield projection dimension | `64` |
| `lucidia.hopfield_memory` | Max memory entries | `256` |

## Testing

Run the unit tests (CPU-only, <2 minutes):

```bash
pytest -q alice_lucidia/tests
```

## Notebook Demo

See `notebooks/demo.ipynb` for a walkthrough covering:

1. Indexing a synthetic dataset into Lucidia's memory.
2. Retrieving and writing rare facts with the Hopfield head.
3. Steering generation with the Schrödinger bridge utilities.
4. An end-to-end Alice ↔ Lucidia conversation.

## License

This project is provided under the MIT License. See `LICENSE` for details.
