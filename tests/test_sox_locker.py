import shutil
import pytest
from close import sox


def setup_module(module):
    shutil.rmtree('artifacts/close/2025-09', ignore_errors=True)


def test_sox_evidence():
    sox.add_evidence('2025-09', 'C-REV-01', 'artifacts/close/REV/cut.md', 'tester')
    with pytest.raises(ValueError):
        sox.check_evidence('2025-09')
    sox.add_evidence('2025-09', 'C-BANK-01', 'artifacts/close/REV/cut.md', 'tester')
    sox.check_evidence('2025-09')
