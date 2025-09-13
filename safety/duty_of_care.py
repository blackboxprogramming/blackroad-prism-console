from __future__ import annotations

from typing import List, Optional

import metrics


def gate(violations: List[str], hitl_approved: bool = True, kg_ok: bool = True) -> Optional[str]:
    if violations:
        metrics.inc("duty_gate_block")
        metrics.record("duty_gate", {"code": "DUTY_SAFETY"})
        return "DUTY_SAFETY"
    if not hitl_approved:
        metrics.inc("duty_gate_block")
        metrics.record("duty_gate", {"code": "DUTY_HITL"})
        return "DUTY_HITL"
    if not kg_ok:
        metrics.inc("duty_gate_block")
        metrics.record("duty_gate", {"code": "DUTY_KG"})
        return "DUTY_KG"
    metrics.record("duty_gate", {"code": "OK"})
    return None
