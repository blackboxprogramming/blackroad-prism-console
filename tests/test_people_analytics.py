from pathlib import Path
from people import analytics


def test_analytics(tmp_path: Path):
    demo = Path('fixtures/people/demographics.csv')
    attr = Path('fixtures/people/attrition.csv')
    data = tmp_path / 'kanban.json'
    data.write_text('[]')
    out = tmp_path / 'out'
    metrics = analytics.build(demo, attr, data, Path('configs/people/pay_bands.yaml'), out)
    assert metrics['headcount'] == 3
    assert (out / 'dashboard.html').exists()
