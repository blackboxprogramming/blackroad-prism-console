# Retrieval Index

`retrieval/index.py` builds a simple inverted index over text files in the `artifacts` directory.
It stores the index at `artifacts/retrieval/index.json` and supports keyword search via the CLI:

```
python -m cli.console index:build
python -m cli.console search --q "error budget"
```

Add new sources by placing text files in `artifacts/`.
