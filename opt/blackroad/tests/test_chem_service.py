import json, requests, os

BASE = os.environ.get("CHEM_BASE", "http://127.0.0.1:7014")

def test_openapi():
    r = requests.get(f"{BASE}/openapi.json", timeout=5)
    assert r.ok

def test_descriptors():
    r = requests.post(f"{BASE}/v1/descriptors", json={"smiles":"c1ccccc1O"}, timeout=10)
    assert r.ok
    data = r.json()
    for k in ["MolWt","TPSA","LogP"]:
        assert k in data
