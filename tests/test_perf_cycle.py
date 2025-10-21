from pathlib import Path
from people import perf_cycle


def test_perf_cycle(tmp_path: Path):
    config = Path('configs/people/perf_cycle.yaml')
    demo = Path('fixtures/people/demographics.csv')
    out = tmp_path / 'perf'
    packets = perf_cycle.new_cycle('2025H2', config, demo, out)
    assert len(packets) == 3
    counts = perf_cycle.calibrate(out)
    assert counts['impact'][3] == 3
