import json
import shutil
import jsonschema
from rnd import ideas, experiments, radar, ip, notes
from rnd import ARTIFACTS, LAKE


def _clean():
    shutil.rmtree(ARTIFACTS, ignore_errors=True)
    shutil.rmtree(LAKE, ignore_errors=True)
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    LAKE.mkdir(parents=True, exist_ok=True)
    (notes.NOTES_DIR).mkdir(parents=True, exist_ok=True)
    # ensure sample note
    (notes.NOTES_DIR / "sample.md").write_text("tags: test\ncontent")


def test_contract_validation():
    _clean()
    idea = ideas.new("c", "p", "s", "u", [])
    exp = experiments.design(idea.id, "h", "m")
    experiments.run(exp.id)
    ip.new(idea.id, "t", ["U"], ["US"])
    radar.add("Go", "Trial", "Languages", "r")
    radar.build()
    notes.index()
    checks = [
        ("artifacts/lake/rnd_ideas.json", "contracts/schemas/rnd_ideas.json"),
        ("artifacts/lake/rnd_experiments.json", "contracts/schemas/rnd_experiments.json"),
        ("artifacts/lake/rnd_ip.json", "contracts/schemas/rnd_ip.json"),
        ("artifacts/lake/rnd_radar.json", "contracts/schemas/rnd_radar.json"),
        ("artifacts/lake/rnd_notes_index.json", "contracts/schemas/rnd_notes_index.json"),
    ]
    for path, schema in checks:
        data = json.loads(open(path).read())
        sch = json.loads(open(schema).read())
        jsonschema.validate(data, sch)
