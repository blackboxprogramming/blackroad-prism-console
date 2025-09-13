from pathlib import Path
from people import comp_cycle


def test_comp_cycle(tmp_path: Path):
    demo = Path('fixtures/people/demographics.csv')
    policy = Path('configs/people/comp_policy.yaml')
    out = tmp_path / 'comp'
    comp_cycle.plan('2025H2', demo, policy, out)
    assert (out / 'comp_grid.csv').exists()
    comp_cycle.letters(out)
    assert (out / 'letters' / 'E1.md').exists()
