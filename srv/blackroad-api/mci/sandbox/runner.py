#!/usr/bin/env python3
import json, sys
import sympy as sp

def main():
    try:
        data = json.load(sys.stdin)
        expr = data.get("expr", "")
        mode = data.get("mode", "both")
        vars_dict = data.get("vars", {}) or {}
        precision = int(data.get("precision", 64))
        precision = max(32, min(precision, 4096))
        sym = sp.sympify(expr)
        tree = str(sym)
        result = {"id": "mci_req", "mode": mode, "warnings": [], "cache_hit": False}
        if mode in ("symbolic", "both"):
            result["symbolic"] = {"latex": sp.latex(sym), "tree": tree}
        if mode in ("numeric", "both"):
            subs = {sp.symbols(k): v for k, v in vars_dict.items()}
            numeric_val = float(sym.evalf(precision, subs=subs))
            result["numeric"] = {"value": numeric_val, "units": None, "precision": precision}
        result["duration_ms"] = 0
        json.dump(result, sys.stdout)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)

if __name__ == "__main__":
    main()
