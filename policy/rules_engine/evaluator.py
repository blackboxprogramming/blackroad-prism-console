from __future__ import annotations

import ast
import operator
import re
from dataclasses import dataclass
from typing import Any, Callable, Dict, Mapping

from .context import EvaluationContext


_OPERATORS: Dict[type, Callable[[Any, Any], Any]] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.BitAnd: operator.and_,
    ast.BitOr: operator.or_,
    ast.BitXor: operator.xor,
}

_COMPARATORS: Dict[type, Callable[[Any, Any], bool]] = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.In: lambda left, right: left in right,
    ast.NotIn: lambda left, right: left not in right,
    ast.Is: operator.is_,
    ast.IsNot: operator.is_not,
}

_BOOL_OPS: Dict[type, Callable[[Any, Any], bool]] = {
    ast.And: lambda a, b: bool(a) and bool(b),
    ast.Or: lambda a, b: bool(a) or bool(b),
}

_UNARY_OPS: Dict[type, Callable[[Any], Any]] = {
    ast.Not: operator.not_,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

_BUILTINS: Dict[str, Callable[..., Any]] = {
    "abs": abs,
    "len": len,
    "min": min,
    "max": max,
    "sum": sum,
    "any": any,
    "all": all,
}


def _prepare_expression(expr: str) -> str:
    prepared = expr.replace("&&", " and ").replace("||", " or ")
    # Replace standalone ! with not
    out = []
    i = 0
    while i < len(prepared):
        ch = prepared[i]
        if ch == "!":
            nxt = prepared[i + 1] if i + 1 < len(prepared) else ""
            prev = prepared[i - 1] if i > 0 else ""
            if nxt == "=" or prev in ("=", "!", "<", ">"):
                out.append("!")
            else:
                out.append(" not ")
            i += 1
            continue
        out.append(ch)
        i += 1
    prepared = "".join(out)
    prepared = re.sub(r"\btrue\b", "True", prepared)
    prepared = re.sub(r"\bfalse\b", "False", prepared)
    prepared = re.sub(r"\bnull\b", "None", prepared)
    return prepared


@dataclass
class ExpressionEvaluator:
    """Evaluate policy expressions against an event."""

    source: str

    def __post_init__(self) -> None:
        prepared = _prepare_expression(self.source)
        tree = ast.parse(prepared, mode="eval")
        self._expr = tree.body

    # -----------------------------------------------------------------
    def evaluate(self, event: Mapping[str, Any], ctx: EvaluationContext) -> Any:
        return self._eval_node(self._expr, event, ctx)

    # -----------------------------------------------------------------
    def _eval_node(self, node: ast.AST, event: Mapping[str, Any], ctx: EvaluationContext) -> Any:
        if isinstance(node, ast.BoolOp):
            return self._eval_boolop(node, event, ctx)
        if isinstance(node, ast.BinOp):
            left = self._eval_node(node.left, event, ctx)
            right = self._eval_node(node.right, event, ctx)
            op = _OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError(f"unsupported binary operator: {ast.dump(node.op)}")
            return op(left, right)
        if isinstance(node, ast.UnaryOp):
            operand = self._eval_node(node.operand, event, ctx)
            op = _UNARY_OPS.get(type(node.op))
            if op is None:
                raise ValueError(f"unsupported unary operator: {ast.dump(node.op)}")
            return op(operand)
        if isinstance(node, ast.Compare):
            return self._eval_compare(node, event, ctx)
        if isinstance(node, ast.Call):
            return self._eval_call(node, event, ctx)
        if isinstance(node, ast.IfExp):
            cond = self._eval_node(node.test, event, ctx)
            branch = node.body if cond else node.orelse
            return self._eval_node(branch, event, ctx)
        if isinstance(node, ast.Name):
            if node.id in ("True", "False", "None"):
                return eval(node.id)
            if node.id in _BUILTINS:
                return _BUILTINS[node.id]
            return ctx.resolve(node.id, event)
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.List):
            return [self._eval_node(elt, event, ctx) for elt in node.elts]
        if isinstance(node, ast.Tuple):
            return tuple(self._eval_node(elt, event, ctx) for elt in node.elts)
        if isinstance(node, ast.Set):
            return {self._eval_node(elt, event, ctx) for elt in node.elts}
        if isinstance(node, ast.Dict):
            return {
                self._eval_node(key, event, ctx): self._eval_node(value, event, ctx)
                for key, value in zip(node.keys, node.values)
            }
        if isinstance(node, ast.Subscript):
            container = self._eval_node(node.value, event, ctx)
            index = self._eval_node(node.slice, event, ctx)  # type: ignore[arg-type]
            return container[index]
        if isinstance(node, ast.Attribute):
            target = self._eval_node(node.value, event, ctx)
            return getattr(target, node.attr)
        raise ValueError(f"unsupported expression node: {ast.dump(node)}")

    # -----------------------------------------------------------------
    def _eval_boolop(self, node: ast.BoolOp, event: Mapping[str, Any], ctx: EvaluationContext) -> Any:
        op = _BOOL_OPS.get(type(node.op))
        if op is None:
            raise ValueError(f"unsupported bool operator: {ast.dump(node.op)}")
        result = self._eval_node(node.values[0], event, ctx)
        for value in node.values[1:]:
            result = op(result, self._eval_node(value, event, ctx))
        return result

    def _eval_compare(self, node: ast.Compare, event: Mapping[str, Any], ctx: EvaluationContext) -> bool:
        left = self._eval_node(node.left, event, ctx)
        for op, comparator in zip(node.ops, node.comparators):
            right = self._eval_node(comparator, event, ctx)
            operator_fn = _COMPARATORS.get(type(op))
            if operator_fn is None:
                raise ValueError(f"unsupported comparator: {ast.dump(op)}")
            if not operator_fn(left, right):
                return False
            left = right
        return True

    def _eval_call(self, node: ast.Call, event: Mapping[str, Any], ctx: EvaluationContext) -> Any:
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            if func_name == "rate":
                predicate_node = node.args[0]
                window = self._eval_node(node.args[1], event, ctx) if len(node.args) > 1 else ""
                series = ctx.series
                if isinstance(predicate_node, ast.Call) and isinstance(predicate_node.func, ast.Name):
                    if predicate_node.func.id == "consent_abandonment":
                        return ctx.consent_abandonment_ratio(str(window), series)
                predicate = lambda item: bool(self._eval_node(predicate_node, item, ctx))
                return ctx.rate(predicate, window, series)
            if func_name == "distinct_over":
                field = self._eval_node(node.args[0], event, ctx)
                window = self._eval_node(node.args[1], event, ctx) if len(node.args) > 1 else ""
                series = ctx.series
                return ctx.distinct_over(field, window, series)
            if func_name == "baseline_rate":
                metric = self._eval_node(node.args[0], event, ctx)
                return ctx.baseline_rate(metric)
            if func_name == "last_policy_change_within":
                duration = self._eval_node(node.args[0], event, ctx)
                return ctx.last_policy_change_within(duration)
            if func_name == "duration":
                text = self._eval_node(node.args[0], event, ctx)
                return ctx.duration(text)
            if func_name == "now":
                return ctx.now()
            if func_name == "ingest_lag":
                stream = self._eval_node(node.args[0], event, ctx)
                return ctx.ingest_lag(stream)
            if func_name == "has":
                field_name = self._eval_node(node.args[0], event, ctx)
                return ctx.has(field_name, event)
        func = self._eval_node(node.func, event, ctx)
        args = [self._eval_node(arg, event, ctx) for arg in node.args]
        kwargs = {kw.arg: self._eval_node(kw.value, event, ctx) for kw in node.keywords}
        return func(*args, **kwargs)
