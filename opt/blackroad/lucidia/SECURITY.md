# c-LFM Module Security Notes

This module is designed to run in offline, sandboxed environments.  Key
principles applied here:

* **No network access** – datasets and configs are loaded from the local
  file system only.
* **Non‑root execution** – the Dockerfile creates an unprivileged user
  and the module assumes read‑only model directories at runtime.
* **Deterministic behaviour** – all training utilities accept a seed and
  avoid use of non‑deterministic CUDA kernels.
* **Safe deserialisation** – checkpoints are stored with `torch.save`
  and never unpickled from untrusted sources.

These notes are intentionally brief and should be expanded as the module
matures.
