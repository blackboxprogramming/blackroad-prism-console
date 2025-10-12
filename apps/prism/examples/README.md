# Prism beat-grid examples

The files in this directory demonstrate the updated coding-key format with beat
anchors and the JSON payload produced by the parsing utilities.

- `beat_grid_example.json` – ready-to-send performance payload generated from the
  key. The `meta.budgetUsed` field reflects the total emphasis budget consumed.

The source coding-key used for the example:

```
[We|p1.00|e0.00|p0@1:1:1]
[really|p0.85|e0.35|p+2*@1:1:3]
[need|p0.92|e0.18|p+1@1:2:1]
[this|p0.90|e0.17|p+1!@1:2:2]
[to|p1.00|e0.00|p0@1:2:3]
[land|p0.96|e0.08|p0@1:3:1]
[clearly.|p0.86|e0.22|p+2!@1:3:3]
```

Convert the key file into JSON locally:

```bash
python tools/prism/key_to_json.py <<'KEY'
[We|p1.00|e0.00|p0@1:1:1]
[really|p0.85|e0.35|p+2*@1:1:3]
[need|p0.92|e0.18|p+1@1:2:1]
[this|p0.90|e0.17|p+1!@1:2:2]
[to|p1.00|e0.00|p0@1:2:3]
[land|p0.96|e0.08|p0@1:3:1]
[clearly.|p0.86|e0.22|p+2!@1:3:3]
KEY
```

The Node helper in `apps/prism/packages/agents/src/tools/codingKey.ts` exposes
matching `parseKey` and `reconcileTimes` utilities for server-side usage.
