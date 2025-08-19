#!/usr/bin/env python3
import argparse, json, sys, math, uuid, time, hashlib, os
from typing import Any, Dict, List, Tuple

HARTREE_TO_EV = 27.211386245988

def build_molecule(syscfg: Dict):
    from pyscf import gto
    atoms = syscfg.get("atoms")
    xyz = syscfg.get("xyz")
    unit = syscfg.get("unit", "Angstrom")
    charge = int(syscfg.get("charge", 0))
    spin = int(syscfg.get("spin", 0))  # PySCF expects 2S (num. unpaired electrons)
    basis = syscfg.get("basis", "def2-SVP")

    if xyz:
        mol = gto.Mole(atom=xyz, unit=unit, charge=charge, spin=spin, basis=basis)
    elif atoms:
        fmt = [f"{sym} {c[0]} {c[1]} {c[2]}" for sym, c in atoms]
        mol = gto.Mole(atom="; ".join(fmt), unit=unit, charge=charge, spin=spin, basis=basis)
    else:
        raise ValueError("Provide 'xyz' (string) or 'atoms' (list) in system config.")
    mol.build()
    return mol

def run_scf(mol, method: str, xc: str | None, df: bool, use_gpu: bool):
    m = method.lower()
    if m == "hf":
        from pyscf import scf
        mf = scf.UHF(mol) if mol.spin != 0 else scf.RHF(mol)
        if df:
            mf = mf.density_fit()
    elif m == "dft":
        from pyscf import dft
        mf = dft.UKS(mol) if mol.spin != 0 else dft.RKS(mol)
        mf.xc = xc or "PBE0"
        if df:
            mf = mf.density_fit()
    else:
        raise ValueError(f"Unknown SCF method '{method}'. Use 'hf' or 'dft'.")

    if use_gpu:
        try:
            mf = mf.to_gpu()
        except Exception as e:
            raise RuntimeError(f"GPU requested but to_gpu() failed: {e}")

    e_scf = mf.kernel()
    return mf, float(e_scf)

def run_posthf(mf, method: str) -> Tuple[str, float]:
    m = (method or "none").lower()
    if m == "none":
        return ("none", float(mf.e_tot))
    if m == "mp2":
        from pyscf import mp
        pt = mp.UMP2(mf) if mf.mol.spin != 0 else mp.MP2(mf)
        e_corr, _ = pt.kernel()
        return ("mp2", float(mf.e_tot + e_corr))
    if m == "ccsd":
        from pyscf import cc
        ccobj = cc.UCCSD(mf) if mf.mol.spin != 0 else cc.CCSD(mf)
        e_corr, _ = ccobj.kernel()
        return ("ccsd", float(mf.e_tot + e_corr))
    raise ValueError("posthf must be one of: none | mp2 | ccsd")

def homo_lumo_gap(mf) -> float | None:
    try:
        mo = mf.mo_energy
        occ = mf.mo_occ
        # Restricted: arrays
        if not isinstance(mo, (list, tuple)):
            homo_idx = max([i for i, o in enumerate(occ) if o > 0.5], default=None)
            lumo_idx = min([i for i, o in enumerate(occ) if o < 0.5], default=None)
            if homo_idx is None or lumo_idx is None:
                return None
            return float((mo[lumo_idx] - mo[homo_idx]) * HARTREE_TO_EV)
        # Unrestricted: take alpha channel
        mea, meb = mo
        occa, occb = occ
        homo_a = max([i for i, o in enumerate(occa) if o > 0.5], default=None)
        lumo_a = min([i for i, o in enumerate(occa) if o < 0.5], default=None)
        if homo_a is None or lumo_a is None:
            return None
        return float((mea[lumo_a] - mea[homo_a]) * HARTREE_TO_EV)
    except Exception:
        return None

def canonicalize(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def add_hashes(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Try Lucidia’s PS-SHA∞ agent if present; otherwise use SHA256 on canonical JSON
    try:
        import ps_sha_infinity_agent as psinf
        payload["result_hash"] = psinf.hash_json(payload)  # optional integration point
    except Exception:
        payload["result_hash"] = hashlib.sha256(canonicalize(payload).encode()).hexdigest()
    return payload

def run_job(job: Dict[str, Any]) -> Dict[str, Any]:
    syscfg = job.get("system", {})
    if not syscfg:
        raise ValueError("Missing 'system' block.")
    mol = build_molecule(syscfg)

    scf_method = job.get("scf", {}).get("method", "dft")
    xc = job.get("scf", {}).get("xc", "PBE0") if scf_method.lower() == "dft" else None
    df = bool(job.get("scf", {}).get("density_fit", True))
    gpu = bool(job.get("accelerate", {}).get("gpu", False))

    mf, e_scf = run_scf(mol, scf_method, xc, df=df, use_gpu=gpu)
    post = job.get("posthf", "none")
    post_name, e_tot = run_posthf(mf, post)

    result = {
        "trace_id": f"chem::{int(time.time())}::{uuid.uuid4()}",
        "method": {"scf": scf_method, "xc": xc, "posthf": post_name, "density_fit": df, "gpu": gpu},
        "energy": {"scf_hartree": e_scf, "total_hartree": e_tot},
        "properties": {}
    }
    if "homo_lumo_gap" in job.get("properties", []):
        gap = homo_lumo_gap(mf)
        if gap is not None:
            result["properties"]["homo_lumo_gap_ev"] = gap

    return add_hashes(result)

def main():
    ap = argparse.ArgumentParser(description="Lucidia PySCF agent (offline)")
    ap.add_argument("--job", help="Path to job.json (omit to read stdin)")
    args = ap.parse_args()
    try:
        data = sys.stdin.read() if not args.job else open(args.job, "r").read()
        job = json.loads(data)
        out = run_job(job)
        print(json.dumps(out, indent=2))
    except Exception as e:
        err = {"error": str(e), "trace_id": f"chem::err::{int(time.time())}::{uuid.uuid4()}"}
        err = add_hashes(err)
        print(json.dumps(err, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
