from __future__ import annotations

from typing import Any, Dict


class EvalConnector:
    name = "builtin.eval"

    async def execute(self, *, context: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        expression = params.get("expression", "")
        result = eval(expression, {"__builtins__": {}}, context)  # noqa: S307
        return {"output": result}


__all__ = ["EvalConnector"]

