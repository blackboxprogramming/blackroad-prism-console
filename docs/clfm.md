# Constrained Latent Flow Matching (C-LFM)

This document summarises the minimal C-LFM prototype implemented in this
repository.  C-LFM combines a functional variational auto-encoder with a flow
model operating in the latent space.  Physical or statistical constraints are
injected during VAE pre-training via residual loss terms.

## Modules

- `lucidia.modules.random_fields.functional_vae` – VAE with DeepONet-style
  function decoder.
- `lucidia.modules.random_fields.constraints` – pluggable constraint API.
- `lucidia.modules.random_fields.clfm_engine` – training and sampling engine.
- `lucidia.modules.random_fields.datasets.synthetic_gp` – toy dataset.

## Usage

```
python lucidia/cli/clfm_train.py --epochs 2
python lucidia/cli/clfm_sample.py --samples 3
```

The code is dependency-light (PyTorch only) and avoids vendoring any NASA code.
