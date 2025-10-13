# Cookbook

See the main [cookbook README](../cookbook/README.md) for the full list of tasks. Generate sample data and run pipelines offline:

```bash
make samples
python -m pipelines.finance_margin_pipeline
python -m pipelines.reliability_pipeline
```

Regenerate goldens:

```bash
make goldens
```
