import ast
import operator
import uuid
from pathlib import Path
from typing import Any, Dict, List

import yaml

from sdk import plugin_api
from orchestrator import route
from metrics import record
from prism_io.validate import validate_json


_BIN_OPS: Dict[type, Any] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}

_UNARY_OPS: Dict[type, Any] = {
    ast.Not: operator.not_,
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}

_CMP_OPS: Dict[type, Any] = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.In: lambda a, b: a in b,
    ast.NotIn: lambda a, b: a not in b,
    ast.Is: operator.is_,
    ast.IsNot: operator.is_not,
}


def _eval_node(node: ast.AST, context: Dict[str, Any]) -> Any:
    if isinstance(node, ast.Expression):
        return _eval_node(node.body, context)
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name):
        if node.id not in context:
            raise ValueError("Unknown variable")
        return context[node.id]
    if isinstance(node, ast.Attribute):
        raise ValueError("Attribute access is not allowed")
    if isinstance(node, ast.Call):
        raise ValueError("Function calls are not allowed")
    if isinstance(node, ast.BoolOp):
        values = (_eval_node(value, context) for value in node.values)
        if isinstance(node.op, ast.And):
            for value in values:
                if not value:
                    return False
            return True
        if isinstance(node.op, ast.Or):
            for value in values:
                if value:
                    return True
            return False
        raise ValueError("Unsupported boolean operator")
    if isinstance(node, ast.UnaryOp):
        op = _UNARY_OPS.get(type(node.op))
        if not op:
            raise ValueError("Unsupported unary operator")
        return op(_eval_node(node.operand, context))
    if isinstance(node, ast.BinOp):
        op = _BIN_OPS.get(type(node.op))
        if not op:
            raise ValueError("Unsupported binary operator")
        return op(_eval_node(node.left, context), _eval_node(node.right, context))
    if isinstance(node, ast.Compare):
        left = _eval_node(node.left, context)
        for op_node, comparator in zip(node.ops, node.comparators):
            op = _CMP_OPS.get(type(op_node))
            if not op:
                raise ValueError("Unsupported comparison operator")
            right = _eval_node(comparator, context)
            if not op(left, right):
                return False
            left = right
        return True
    if isinstance(node, ast.Subscript):
        value = _eval_node(node.value, context)
        index = _eval_slice(node.slice, context)
        return value[index]
    if isinstance(node, ast.List):
        return [_eval_node(elt, context) for elt in node.elts]
    if isinstance(node, ast.Tuple):
        return tuple(_eval_node(elt, context) for elt in node.elts)
    if isinstance(node, ast.Dict):
        return {
            _eval_node(key, context): _eval_node(val, context)
            for key, val in zip(node.keys, node.values)
        }
    if isinstance(node, ast.Set):
        return {_eval_node(elt, context) for elt in node.elts}
    raise ValueError(f"Unsupported expression: {ast.dump(node)}")


def _eval_slice(node: ast.AST, context: Dict[str, Any]) -> Any:
    if isinstance(node, ast.Slice):
        lower = _eval_node(node.lower, context) if node.lower else None
        upper = _eval_node(node.upper, context) if node.upper else None
        step = _eval_node(node.step, context) if node.step else None
        return slice(lower, upper, step)
    if isinstance(node, ast.Tuple):
        return tuple(_eval_node(elt, context) for elt in node.elts)
    return _eval_node(node, context)


def _eval_when(expr: str, context: Dict[str, Any]) -> bool:
    if not expr:
        return True
    expr = expr.strip()
    if expr.startswith("{{") and expr.endswith("}}"):  # very small template engine
        expr = expr[2:-2].strip()
    try:
        tree = ast.parse(expr, mode="eval")
        return bool(_eval_node(tree.body, context))
    except Exception:
        return False


def run_workflow(yaml_path: str) -> Dict[str, Any]:
    with open(yaml_path) as f:
        spec = yaml.safe_load(f)
    steps_spec = spec.get("steps", [])
    results: List[Dict[str, Any]] = []
    for step in steps_spec:
        ctx = {"steps": results}
        if "bot" in step:
            if not _eval_when(step.get("when"), ctx):
                results.append({"skipped": True})
                continue
            task = plugin_api.Task(intent=step.get("intent", ""), inputs=step.get("inputs", {}))
            validate_json(task.__dict__, "task")
            resp = route(step["bot"], task)
            validate_json(resp.__dict__, "bot_response")
            results.append({"ok": resp.ok, "content": resp.content, "data": resp.data})
        elif "gather" in step:
            summary = "\n".join(r.get("content", "") for r in results if r.get("content"))
            results.append({"gather": step["gather"], "summary": summary})
    record("workflow_run")
    return {"steps": results}


def write_summary(workflow_id: str, summary: str) -> Path:
    path = Path("artifacts") / workflow_id
    path.mkdir(parents=True, exist_ok=True)
    out = path / "summary.md"
    out.write_text(summary)
    return out
