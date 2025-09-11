# Lucidia Meta Annotator

Reference implementation of the `lucidia-meta-annotator` concept.  It
applies configuration driven metadata overrides while stripping any
temporary attributes whose names start with `_*`.

## Example

```
from lucidia_meta_annotator import load_config, annotate_dataset

cfg = load_config("overrides.yaml")
meta = {"a": 1, "_*temp": "x"}
result, removed = annotate_dataset(meta, cfg)
```

## Threat model

* Configuration files are validated against a minimal schema.
* Optional signature files contain a SHA256 digest of the config and are
  verified on load.
* Temporary attributes never persist to outputs.

_Last updated on 2025-09-11_
