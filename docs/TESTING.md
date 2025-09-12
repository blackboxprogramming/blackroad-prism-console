# Testing the Prism Service

## Node Tests

```bash
npm --prefix prism/server test
```

## Python Tests

```bash
pytest tests/prism
```

Test fixtures live under `tests/prism/fixtures/`. The Node suite uses `vitest`
while Python uses `pytest`. Both commands run independently so contributors can
focus on the stacks they touch.
