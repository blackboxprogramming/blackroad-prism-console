import json
from pathlib import Path
from people import calibration


def test_calibration_flags(tmp_path: Path):
    packets = [
        {"employee": "E1", "level": "L2", "ratings": {"impact": 5}, "salary": 140000},
        {"employee": "E2", "level": "L1", "ratings": {"impact": 4}, "salary": 85000},
    ]
    p = tmp_path / 'packets.json'
    p.write_text(json.dumps(packets))
    flags = calibration.validate(p, Path('configs/people/levels.yaml'), Path('configs/people/pay_bands.yaml'))
    assert 'CAL_OUT_OF_BAND' in flags
    out = tmp_path / 'out'
    calibration.write_artifacts(out, flags)
    assert (out / 'flags.json').exists()
