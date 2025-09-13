import csv
import json
from pathlib import Path

import jsonschema

from close import journal, recon, flux, sox
from close.calendar import CloseCalendar

SCHEMAS = Path("contracts/schemas")


def load_schema(name: str):
    return json.loads((SCHEMAS / f"{name}.json").read_text())


def test_contract_validation(tmp_path):
    period = "2025-09"
    tb = journal.load_tb(period)
    jnls = journal.propose_journals(tb, "configs/close/journals/accruals.yaml")
    adj = journal.post(period, tb, jnls)
    recon.run_recons(period, adj, "configs/close/recons.yaml", "fixtures/finance/recons")
    flux.run_flux(period, "2025-08", "2024-09", 10.0)
    ev_path = tmp_path / "ev.txt"
    ev_path.write_text("e")
    sox.add(period, "C-REV-01", str(ev_path), "user")
    cal = CloseCalendar.from_template(period, "configs/close/template.yaml")
    cal.save()

    schema_tb = load_schema("trial_balance")
    with (Path("artifacts/close") / period / "adjusted_tb.csv").open() as f:
        for row in csv.DictReader(f):
            row["amount"] = float(row["amount"])
            jsonschema.validate(row, schema_tb)

    schema_j = load_schema("journals")
    data_j = json.loads((Path("artifacts/close") / period / "journals.json").read_text())
    for j in data_j:
        jsonschema.validate(j, schema_j)

    schema_r = load_schema("recons")
    data_r = json.loads((Path("artifacts/close") / period / "recons" / "recons.json").read_text())
    for r in data_r:
        jsonschema.validate(r, schema_r)

    schema_f = load_schema("flux_results")
    data_f = json.loads((Path("artifacts/close") / period / "flux" / "flux.json").read_text())
    for r in data_f.values():
        jsonschema.validate(r, schema_f)

    schema_c = load_schema("close_calendar")
    cal_json = json.loads((Path("artifacts/close") / period / "calendar.json").read_text())
    for t in cal_json:
        jsonschema.validate(t, schema_c)

    schema_s = load_schema("sox_evidence")
    data_s = [e.to_dict() for e in sox.list_evidence(period)]
    for e in data_s:
        jsonschema.validate(e, schema_s)
