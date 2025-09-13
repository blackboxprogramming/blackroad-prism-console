import json
import jsonschema
from ir import guidance, kpi_sot
from ir.utils import IR_ARTIFACTS


def test_guidance(tmp_path):
    kpi_sot.compute("2025Q3")
    guidance.run("2025Q4", "configs/ir/assumptions.yaml")
    data = json.load(open(IR_ARTIFACTS / "guidance_2025Q4" / "ranges.json"))
    schema = json.load(open("schemas/ir_guidance.schema.json"))
    jsonschema.validate(data, schema)
