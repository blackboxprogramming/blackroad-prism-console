# Export Controls

The offline export screening engine loads rules from `configs/legal/export/rules.yaml` and evaluates orders for region or entity restrictions.

Example:
```bash
python -m cli.console legal:export:screen --partner P001 --order samples/sales/order_lines.json
```

Violations are returned as codes such as `EXP_REGION_BLOCK`, `EXP_ENTITY_MATCH`, or `EXP_LICENSE_REQUIRED`.
