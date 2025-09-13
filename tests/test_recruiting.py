from pathlib import Path
from people import recruiting


def test_recruiting_metrics(tmp_path: Path):
    data = recruiting.load_reqs(Path('fixtures/people/recruiting'))
    assert len(data) == 8
    fun = recruiting.funnel(data)
    assert fun['accept'] > 0
    sla = recruiting.stage_sla(data)
    assert round(sla['screen'], 1) == 1.5
    ttf = recruiting.time_to_fill(data)
    assert ttf['R1'] == 7
