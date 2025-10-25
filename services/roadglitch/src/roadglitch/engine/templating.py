from __future__ import annotations

import re
from typing import Any, Dict


_TEMPLATE_RE = re.compile(r"\$\{([^}]+)\}")
_SAFE_GLOBALS = {"len": len, "int": int, "float": float, "str": str}


class TemplateEvaluationError(RuntimeError):
    pass


def render_template(value: Any, context: Dict[str, Any]) -> Any:
    if isinstance(value, str):
        matches = _TEMPLATE_RE.findall(value)
        result = value
        for match in matches:
            try:
                replacement = eval(match, _SAFE_GLOBALS, context)  # noqa: S307
            except Exception as exc:  # pragma: no cover - safe guard
                raise TemplateEvaluationError(str(exc)) from exc
            result = result.replace(f"${{{match}}}", str(replacement))
        return result
    if isinstance(value, dict):
        return {key: render_template(val, context) for key, val in value.items()}
    if isinstance(value, list):
        return [render_template(item, context) for item in value]
    return value


__all__ = ["render_template", "TemplateEvaluationError"]

