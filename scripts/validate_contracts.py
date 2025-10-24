import json, os, sys
from jsonschema import validate, Draft202012Validator

SCHEMA_DIR = "contracts/schemas"

def load_schema(name):
    with open(os.path.join(SCHEMA_DIR, name)) as f:
        return json.load(f)

def check(file_path, schema):
    with open(file_path) as f:
        data = json.load(f)
    Draft202012Validator(schema).validate(data)
    print(f"OK {file_path}")

def main():
    # Map artifacts -> schema
    checks = [
        ("artifacts/plm/items.json", "plm_items.schema.json"),
        ("artifacts/plm/boms.json", "plm_boms.schema.json"),
        # Add more as they’re created by CLI flows
    ]
    failed = 0
    for art, sch in checks:
        if not os.path.exists(art):
            print(f"SKIP {art} (missing)")
            continue
        try:
            check(art, load_schema(sch))
        except Exception as e:
            print(f"FAIL {art}: {e}")
            failed += 1
    sys.exit(failed)

if __name__ == "__main__":
    main()
from jsonschema import Draft202012Validator

SCHEMA_DIR = 'contracts/schemas'

MAP = {
  'artifacts/plm/items.json': 'plm_items.schema.json',
  'artifacts/plm/boms.json': 'plm_boms.schema.json',
  'artifacts/mfg/mrp/plan.json': 'mfg_mrp.schema.json',
  'artifacts/mfg/spc/findings.json': 'mfg_spc.schema.json',
  'artifacts/mfg/yield/pareto.csv': None,  # csv checked by existence only
  'artifacts/mfg/coq/coq.csv': None,
}

def _validate_json(path, schema_name):
    with open(os.path.join(SCHEMA_DIR, schema_name)) as f: schema = json.load(f)
    with open(path) as f: data = json.load(f)
    Draft202012Validator(schema).validate(data)
    print('OK', path)

if __name__ == '__main__':
    failed = 0
    for art, sch in MAP.items():
        if not os.path.exists(art):
            print('SKIP', art)
            continue
        try:
            if sch:
                _validate_json(art, sch)
            else:
                print('OK(nojson)', art)
        except Exception as e:
            print('FAIL', art, e)
            failed += 1
    sys.exit(failed)
