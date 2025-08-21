from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sympy import (
    symbols, sympify, latex, diff, integrate, series, Eq, N, lambdify
)
from sympy import (
    sin, cos, tan, asin, acos, atan, atan2,
    sinh, cosh, tanh, asinh, acosh, atanh,
    exp, log, sqrt, Abs, floor, ceiling, pi, E
)
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import io, base64, re

app = FastAPI(title="SymPy JSON API", version="1.1")

SAFE_FUNCS = {
    'sin': sin, 'cos': cos, 'tan': tan, 'asin': asin, 'acos': acos, 'atan': atan, 'atan2': atan2,
    'sinh': sinh, 'cosh': cosh, 'tanh': tanh, 'asinh': asinh, 'acosh': acosh, 'atanh': atanh,
    'exp': exp, 'log': log, 'sqrt': sqrt, 'abs': Abs, 'floor': floor, 'ceil': ceiling,
    'pi': pi, 'E': E
}

class ComputeReq(BaseModel):
    expr: str                              # e.g. "sin(x)^2 + cos(x)^2"
    vars: Optional[List[str]] = None       # e.g. ["x"]
    do: Optional[List[str]] = None         # subset of: simplify, diff, integrate, series, solve, numeric, plot
    series_order: int = 6
    plot: bool = False
    plot_min: float = -5
    plot_max: float = 5
    target_eq_zero: bool = False           # if True, solve expr == 0

def _mk_symbols(names: Optional[List[str]]) -> Dict[str, Any]:
    if not names:
        return {}
    sym_objs = symbols(" ".join(names))
    if isinstance(sym_objs, tuple):
        return {str(s): s for s in sym_objs}
    return {str(sym_objs): sym_objs}

MATH_TOKEN = re.compile(r"[0-9\^\*\+\-/=(){}\[\]a-zA-Z_]+")

@app.post("/compute")
def compute(req: ComputeReq):
    # Heuristic default variable
    if not req.vars:
        # Try to infer common symbols in order
        guess = []
        for v in ["x","y","z","t","n","k"]:
            if v in req.expr:
                guess.append(v)
        req.vars = guess or ["x"]

    allowed = _mk_symbols(req.vars)
    local_env = {**allowed, **SAFE_FUNCS}

    try:
        expr = sympify(req.expr, locals=local_env, evaluate=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {e}")

    x = next(iter(allowed.values()), None)
    tasks = set(req.do or ["simplify","diff","integrate","series","solve","numeric"])

    out: Dict[str, Any] = {
        "input": req.expr,
        "vars": list(allowed.keys()),
        "expr_latex": latex(expr)
    }

    # Simplify
    if "simplify" in tasks:
        try:
            out["simplify_latex"] = latex(expr.simplify())
        except Exception as e:
            out["simplify_error"] = str(e)

    # Derivative
    if "diff" in tasks and x is not None:
        try:
            out["derivative_latex"] = latex(diff(expr, x))
        except Exception as e:
            out["diff_error"] = str(e)

    # Integral
    if "integrate" in tasks and x is not None:
        try:
            out["integral_latex"] = latex(integrate(expr, x))
        except Exception as e:
            out["integrate_error"] = str(e)

    # Series
    if "series" in tasks and x is not None:
        try:
            out["series_latex"] = latex(series(expr, x, 0, req.series_order).removeO())
        except Exception as e:
            out["series_error"] = str(e)

    # Solve expr == 0 (if requested or looks like an equation without '=')
    if "solve" in tasks and x is not None:
        try:
            from sympy import solve
            if req.target_eq_zero or ("=" not in req.expr and MATH_TOKEN.fullmatch(req.expr.strip())):
                sols = solve(Eq(expr, 0), x)
            else:
                # if it's "lhs = rhs"
                if "=" in req.expr:
                    lhs, rhs = req.expr.split("=", 1)
                    lhs_s = sympify(lhs, locals=local_env)
                    rhs_s = sympify(rhs, locals=local_env)
                    sols = solve(Eq(lhs_s, rhs_s), x)
                else:
                    sols = []
            out["roots"] = [str(s) for s in sols]
            out["roots_latex"] = [latex(s) for s in sols]
        except Exception as e:
            out["solve_error"] = str(e)

    # Numeric
    if "numeric" in tasks:
        try:
            out["numeric"] = float(N(expr))
        except Exception:
            out["numeric"] = None

    # Plot (numpy + matplotlib; 1D only)
    if req.plot and x is not None:
        try:
            f = lambdify(x, expr, modules=["numpy", SAFE_FUNCS])
            xs = np.linspace(req.plot_min, req.plot_max, 800)
            ys = f(xs)
            fig, ax = plt.subplots()
            ax.plot(xs, ys)
            ax.set_xlabel(str(x))
            ax.set_ylabel("f({})".format(str(x)))
            ax.grid(True)
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
            plt.close(fig)
            out["plot_png_b64"] = base64.b64encode(buf.getvalue()).decode()
        except Exception as e:
            out["plot_error"] = str(e)

    return out
