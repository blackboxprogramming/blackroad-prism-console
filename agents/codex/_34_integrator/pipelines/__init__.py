
"""Re-export Codex-34 pipeline modules for testability."""
from __future__ import annotations

import sys
from importlib import import_module

_modules = {
    'normalize_event': import_module('pipelines.normalize_event'),
    'diff_patch': import_module('pipelines.diff_patch'),
    'drift_detect': import_module('pipelines.drift_detect'),
    'consent_scope': import_module('pipelines.consent_scope'),
    'queue_io': import_module('pipelines.queue_io'),
    'energy_meter': import_module('pipelines.energy_meter'),
}

for name, module in _modules.items():
    sys.modules[f'{__name__}.{name}'] = module

__all__ = list(_modules)
